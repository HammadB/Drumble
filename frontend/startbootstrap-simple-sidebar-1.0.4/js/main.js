var app = angular.module('lectureBuddy', []);

app.controller('mainController', ['$scope', function($scope) {
  $scope.view = 'question-feed';
}]);