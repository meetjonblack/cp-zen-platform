'use strict';

function manageDojos($scope, dojoManagementService, alertService, auth, tableUtils, cdDojoService, $location) {
  $scope.filterValue = 1;
  $scope.itemsPerPage = 10;

  $scope.pageChanged = function(){
    $scope.loadPage(+$scope.filterValue, false);
  }

  var verficationStates = [
    {label: 'Unverified', value: 0},
    {label: 'Verified', value: 1},
    {label: 'Previous', value: 2}
  ];

  var changedDojos = [];

  $scope.getVerificationStates = function(isSigned){
    return isSigned ? verficationStates : [verficationStates[0], verficationStates[2]];
  };

  $scope.editDojo = function(dojo) {
    cdDojoService.setDojo(dojo, function(response) {
      $location.path('/edit-dojo');
    }, function (err){
      if(err){
        alertService.showError(
          'An error has occurred while editing dojo: <br /> '+
          (err.error || JSON.stringify(err))
        );
      }
    });
  };

  $scope.loadPage = function(verified, resetFlag, cb){
    cb = cb || function(){};
    var loadPageData = tableUtils.loadPage(resetFlag, $scope.itemsPerPage, $scope.pageNo, verified);
    $scope.pageNo = loadPageData.pageNo;
    $scope.dojos = [];
    loadPageData.config.verified = verified;

    dojoManagementService.loadDojos(loadPageData.config,  function(err, results){
      if(err){
        alertService.showError('An error has occurred while loading Dojos: <br>' +
          (err.error || JSON.stringify(err))
        );
        return; 
      }

      $scope.dojos = _.map(results.dojos, function(dojo){
        dojo.verified = _.findWhere(verficationStates, {value: dojo.verified});
        return dojo;
      });

      $scope.totalItems = results.totalItems;

      return cb();
    });
  };

  $scope.filterDojos =  function(){
    $scope.loadPage(+$scope.filterValue, true);
    changedDojos = [];
  };

  $scope.processDojos = function(event){

    changedDojos = _.map(changedDojos, function(dojo){
      if(dojo.creatorEmail){
        delete dojo.creatorEmail;
      }

      if(dojo.agreements){
        delete dojo.agreements;
      }

      return dojo;
    });

    $scope.dojosToBeDeleted = _.filter(changedDojos, function(changedDojo){
      return changedDojo.toBeDeleted;
    });

    $scope.dojosToBeUpdated = _.filter(changedDojos, function(changedDojo){
      return !changedDojo.toBeDeleted;
    });

    function updateDojos(cb){
      if(!_.isEmpty($scope.dojosToBeUpdated)){
        var dojosToBeUpdated = _.map($scope.dojosToBeUpdated, function(dojo){
          dojo.verified = dojo.verified.value;

          return dojo;
        });

        dojoManagementService.bulkUpdate(dojosToBeUpdated, function(err, response){
          if(err){
            alertService.showError('An error has occurred while updating Dojos: <br>' +
              (err.error || JSON.stringify(err)));
            
            return cb(err);
          }

          cb(null, response);

        });
      } else {
        cb();
      }
    }

    function deleteDojos(cb){
      if(!_.isEmpty($scope.dojosToBeDeleted)){
        var dojos = _.map($scope.dojosToBeDeleted, function(dojo){
          return {id: dojo.id, creator: dojo.creator};
        });


        dojoManagementService.bulkDelete(dojos, function(err, response){
          if(err){
            alertService.showError('An error has occurred while deleting Dojos: <br>' +
                      (err.error || JSON.stringify(err)));

            return cb(err);
          }

          cb(null, response);
        });

      } else {
        cb();
      }
    }

    async.series([updateDojos, deleteDojos], function(err){
      delete $scope.dojosToBeDeleted;
      delete $scope.dojosToBeUpdated;
      changedDojos = [];
      if(err){
        alertService.showError('An error has occurred while updating Dojos: <br>' +
              (err.error || JSON.stringify(err)));  
      }
      $scope.loadPage(+$scope.filterValue, false);
    });  
  };


  $scope.pushChangedDojo = function(dojo){
    var exists = !!(_.find(changedDojos, function(changedDojo){ 
                      return dojo.id === changedDojo.id;
                    }));

    

    if((dojo.verified.value !== $scope.filterValue) || (dojo.toBeDeleted)){
      if(!exists){
        changedDojos.push(dojo);
      }

    } else if(dojo.verified.value === $scope.filterValue && !dojo.toBeDeleted) {
      changedDojos =  _.filter(changedDojos, function(filteredDojo){
                        return dojo.id !== filteredDojo.id;
                      }); 
    }

  };

  auth.get_loggedin_user(function(){
    $scope.loadPage(1, true);
  });
}

angular.module('cpZenPlatform')
  .controller('manage-dojo-controller', 
  ['$scope', 'dojoManagementService', 'alertService', 'auth', 'tableUtils', 'cdDojoService', '$location', manageDojos]);
