const mongoose = require('mongoose');
const slugify = require('slugify');
const User = require('./userModel');

//1
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour should have a name'],
      minlength: [10, 'A tour should have a minimum length of atleast 10'],
      maxlength: [40, 'A tour should have a maximum length of 40'],
      unique: true,
    },
    ratingsAverage: {
      type: Number,
      default: 4.7,
      min: [1, 'rating must be above 1'],
      max: [5, 'rating must be below 5'],
    },
    duration: {
      type: String,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: String,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficult is either either easy,medium or difficult',
      },
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour should have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return this.val > this.price;
        },
        message: 'Discount price cannot be more than the price itself',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    image: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
    },
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    // guides: Array,
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    //note we have to enable the virtual in the toJSON, these are the schema options
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
    bufferCommands: true,
  }
);

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });

//2
tourSchema.virtual('durationInWeeks').get(function () {
  return this.duration / 7;
});
//3 this is virtual populating
tourSchema.virtual('reviews', {
  ref: 'Reviews',
  foreignField: 'tour',
  localField: '_id',
});

//4
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true }); //slug is the last part of the url usually used to identify the resource from it alright yeah
  next();
});

//this is for the embedding the user inside the tour model
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => {
//     const user = await User.findById(id);
//     return user;
//   });
//   this.guides = await Promise.all(guidesPromises);
//   console.log(this.guides);
//   next();
// });
//very important note here
/*
see when we use async await, we are actually awaiting the response alright
that response is something we can use later on inside the function alright yeah 
it basically awaits the execution flow at that and you can use that value inside it alright yeah
but if you are to use that value outside of the function, remember that an async function will always return a promise alright yeah 
and even if the return statement has the await of some promise
the main function in which its defined would always return a promise only 
okay
see returning await was giving issues, hence we needed to use the return user and that is working properly, will investigate
see when we embed something those values are also stored in the db
but if consider that we are to reference them, then they are not stored in the db, they are just retrived when we query them alright yeah 
we wont embed the data in the final implementation because if the user is changed, then in the tours table we will again have to implement them alright yeah 
*/
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    // select: '- _v -passwordChangedAt',
  });
  next();
});
/*
see when we select we tell to show it, but when we do - in the value we tell to not show it alright 
*/

//post is called when the data has been successfully saved in the database
tourSchema.post('save', function (doc, next) {
  console.log(this);
  next();
});

//important thing to note, these are the mongoose middleware
//they run before or after the database operations are being done or already done alright yeah

//QUERY MIDDLEWARES
tourSchema.pre('/^find/', function (next) {
  this.find({ secretTour: true });
  next();
  //basically this here means query and we are chaining this find on it
});

tourSchema.post('/^find/', function (docs, next) {
  console.log(docs);
  next();
});

//AGGREGATOR MIDDLEWARE
tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  console.log(this.pipeline());
  next();
});
const tours = mongoose.model('tours', tourSchema, 'tours');
module.exports = tours;

/*
see the startLocation is basically like, its a geoLocation setting up
in this we have the type as point alright 
and then in coordinates we have the number alright yeah
this special type is geoJson alright yeah
*/

/*
see when we create a reference, we specify it in the schema itself alright
but the data doesnt get populated inside it automatically alright yeah
for populating the data we have to provide it in a populate function 
and its this populate functiovn which runs and adds the value
but note this value is not added to the database, its only added to the result of the query to show us
and we could have implemented it in the response handler itself
but instead of that we implement it inside the query middleware so that its run everytime we run this query
and query middlewares are to run a piece of code before the data gets saved 
and see populate is only to present data in the query its not for presenting data inside the database alright yeah
*/

/* 1 you can send any other data apart from what is defined in the schema
but only what is defined in the schema would be the one taken up
rest will be discarded
also if there are validation errors which come when a required value is missing
of the unique property is not satisfied, then we will have errors too
*/

/* 2 virtual properties are those which are derieved from some other property already stored in the database, and hence we dont save it, rather calculate it this way
it needs that we allow the schema properties to show virtuals in it alright yeah
*/

/* 3
we need virtual populating because we need access to the reviews in tour too
we dont know how big the reviews array can be, hence embedding them or even child referencing them will be a wrong decision
hence we have done parent referencing in the reviews model
but we still need it here
the two approaches can be that we make another call to the reviews and fetch the docs/reviews of our particular tour
or we maintain the child referencing, child referencing is not an optio  n because of the memory issue discussed above
hence we make another call, but instead of making it manually we use the virtual populate to get the items alright yeah 
*/

/* 4
Mongoose has middlewares, which we can run for specific conditions, like we have middlewares which run for specific paths, there are four types of middlewares in it actually, and what we provide in the functions is the code which is actually run
so these .pre .post with hooks is run on certain action like save find etc on which to execute
*/
