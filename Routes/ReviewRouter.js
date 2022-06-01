const express = require('express');
const reviewController = require('./../Controllers/ReviewController');
const reviewRouter = express.Router({
  mergeParams: true,
}); // this is to get the params from routers
const authController = require('./../Controllers/authController');

reviewRouter
  .route('/')
  .get(authController.protectRoute, reviewController.getAllReviews)
  .post(
    authController.protectRoute,
    // authController.restrictTo('user'),
    reviewController.createNewReview
  );

module.exports = reviewRouter;
