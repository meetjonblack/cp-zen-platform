 'use strict';

function cdBadgesDashboardCtrl($scope, cdBadgesService, utilsService) {
  $scope.badges = {};
  $scope.badgeInfo = {};
  $scope.badgeInfoIsCollapsed = {};
  var lastClicked = {};

  cdBadgesService.listBadges(function (response) {
    var badges = response.badges;

    //Filter badges because badgekit api doesn't support querying by tags.
    cdBadgesService.loadBadgeCategories(function (response) {
      $scope.categories = response.categories;
      _.each($scope.categories, function (category) {
        _.each(badges, function (badge) {
          var indexFound;
          var categoryFound = _.find(badge.tags, function (tag, index) {
            indexFound = index;
            return tag.value === category;
          });

          if(categoryFound) {
            var tmpBadge = angular.copy(badge);
            tmpBadge.tags.splice(indexFound, 1);
            if(!$scope.badges[category]) $scope.badges[category] = {};
            _.each(tmpBadge.tags, function (tag) {
              if(!$scope.badges[category][tag.value]) $scope.badges[category][tag.value] = [];
              $scope.badges[category][tag.value].push(badge);
            });
          }
        });
      });
    });
  });

  $scope.capitalizeFirstLetter = utilsService.capitalizeFirstLetter;

  $scope.showBadgeInfo = function (tag, badge) {
    if(lastClicked[tag] !== badge.id && $scope.badgeInfoIsCollapsed[tag]) {
      $scope.badgeInfo[tag] = badge;
    } else {
      $scope.badgeInfo[tag] = badge;
      $scope.badgeInfoIsCollapsed[tag] = !$scope.badgeInfoIsCollapsed[tag];
    }
    lastClicked[tag] = badge.id;
  }

  $scope.categorySelected = function () {
    lastClicked = {};
    $scope.badgeInfoIsCollapsed = {};
  }
    
}

angular.module('cpZenPlatform')
  .controller('badges-dashboard-controller', ['$scope', 'cdBadgesService', 'utilsService', cdBadgesDashboardCtrl]);