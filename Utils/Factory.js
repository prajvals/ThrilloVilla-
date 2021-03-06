const catchAsync = require('./catchAsync');
const AppError = require('./AppError');
const ApiFeatures = require('./../Utils/ApiFeatures');

exports.deleteOne = (Model, nameOfModel) =>
  catchAsync(async (req, res, next) => {
    const data = await Model.findByIdAndDelete(req.params.id);

    if (!data) {
      return next(new AppError(`No ${nameOfModel} found with this record`));
    }
    res.status(204).json({
      status: 'Success',
    });
  });
exports.updateOne = (Model, nameOfModel) =>
  catchAsync(async (req, res, next) => {
    const data = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!data) {
      return next(AppError(`No ${nameOfModel} found with this record`));
    }

    res.status(200).json({});
  });
exports.createOne = (Model, nameOfModel) =>
  catchAsync(async (req, res, next) => {
    const contents = req.body;
    const data = await Model.create(contents);
    //create is very similar to save, but its like it runs save for a collection of documents and saves them, you can use it with just one doc too

    res.status(200).json({
      status: 'Success',
      data,
    });

    //see what it returns in async await is what it passes as the response data in
    //.then() alright
  });
exports.getOne = (Model, nameOfModel, populateOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (populateOptions) {
      query = query.populate(populateOptions);
    }
    const data = await query;
    //note: this is for handling the error that we were returning null
    //but if there is really a validation error or similar to this
    //there would be a mongo db error that would be caught by the global error handling
    //functions alright yeah
    if (!data) {
      return next(new AppError(`No ${nameOfModel} found with this record`));
    }
    console.log(data);
    res.status(200).json({
      data,
    });
    // res.status((data) => {
    //   res.status(200).json({
    //     data,
    //   });
    // });

    // .then((data) => {
    //   res.status(200).json({
    //     data,
    //   });
    // })

    // .catch((err) => {
    //   console.log(err);
    //   res.status(400).json({
    //     status: 'fail',
    //     message: 'Improper request',
    //   });
    // });

    // console.log(req.params);
    // let particularTour;
    // console.log(tourList);
    // particularTour = tourList.find((element) => element.id === req.params.id);
    // // for (const element of tourList) {
    //   if (element.id === req.params.id) {
    //     console.log(element.id);
    //     console.log(element);
    //     particularTour = element;
    //     break;
    //   }
    // }
  });
exports.getAll = (Model, nameOfModel, filterOptions = {}) =>
  catchAsync(async (req, res, next) => {
    let filter = {};
    if (req.params.id) {
      filter = { tour: req.params.id };
    }

    const featureObject = new ApiFeatures(Model.find(filter), req.query)
      .filter(filterOptions)
      .paginate()
      .fieldLimiting()
      .sort();
    // await featureObject.query.explain(); is used to get execution stats
    const data = await featureObject.query;
    console.log(data.length);
    res.status(200).json({
      status: 'Success',
      resultSize: data.length,
      data: {
        data,
      },
    });
  });

/*

explaination for catch Async and global error handling 

okay this needs a lil bit of more attention 
1. see when we are creating a global exception handler, we want to pass all the exceptions to it only right 
2. when we use async await, the exception handling is done using the try catch block
3. which leads to repeated code everytime and violates the principle of handling errors in one central place alright yeah 
4. now important thing here is when we use catch async, we are passing a function to it
5. this is the original function we want to execute alright 
6. but executing the function will return us the object/promise because its an async function
7. while the router expects this routeHandler to actually have a function assigned to it which it can run to return a response
8. when we wrap the function inside the catchAsync and actually return the function
9. then its returning an object/promise alright yeah
10. so instead of calling the main function inside the catchAsync we return one function from it 
11. and its this function which is run by the express, and hence it gets the req,res,next objects which we pass to our main function
12. our main function being a async function returns a promise which we can use to catch errors
13.now the catch having the next is basically because the catch passes the error object into its function right, this function is usually the one we create alright yeah
14. so here if we are passing next, then this function is getting the next object into it already


added later
1. the route handlers expect a function which they can call when they are requested alright 
2. and since these functions are async await functions, for any error catching we have to do inside of these functions and that would mean a lot of try and catch blocks alright 
3. if we consider the implication, that these functions will actually return a promise but we dont have to worry about it, because what we want from these functions we are already making them do inside their body only
4. the route handlers have to have a function which gets invoked, they dont want the return value 
5. when using the global error handler, we need to get the error
6. so we wrap the function inside a catchAsync function, which should ideally be able to catch all the errors too and also return a function which gets executed by the route handlers
7. so inside the catchAsync we return another function which executes the original function
8. this serves the requirement that routeHandlers are actually having a function they point to 
9. and inside the function we return we run the original function, and since async await functions return promise we use catch to catch the error
10. passing next to a catch function does the job of handling the error to global error handler
11. catchAsync is a mechanism of catching errors from routeHandlers
12. appError or global error handlers are the mechanism of handling those errors in one place
13. note that now, in routeHandlers, we are actually pointing to the function which is returned by catchAsync, by actually calling catchAsync at the routeHandler place alright yeah
*/
