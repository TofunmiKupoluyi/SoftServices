var app = angular.module("myApp-client", ["ngStorage"]);
app.service("loginService", ["$q", "$http", function($q, $http) {
    this.login = function(data) {
        var deferred = $q.defer();
        $http.post("/clientLogin", data).then(function(response) {
            deferred.resolve(response.data);
        });
        return deferred.promise;
    };
}]);
app.service("clientInformationService", ["$q", "$http", function($q, $http) {
    this.getInfo = function() {
        var deferred = $q.defer();
        $http.get("/client/info").then(function(response) {
            deferred.resolve(response.data.res[0]);
        });

        return deferred.promise;
    };

    this.getProjectInformation = function() {
        var deferred = $q.defer();
        $http.get("/clientProject/projectInfo").then(function(response) {
            deferred.resolve(response.data.res);
        });
        return deferred.promise;
    };

    this.getCategories = function() {
        var deferred = $q.defer();
        $http.get("/client/categoryInfo").then(function(response) {
            deferred.resolve(response.data.res);
        });
        return deferred.promise;
    };

    this.sortCategories = function(array) {
        var object = {
            categoryNames: [],
            groupings: {}
        };
        for (var i = 0; i < array.length; i++) {
            if (object.categoryNames.indexOf(array[i].category) == -1) {
                object.categoryNames.push(array[i].category);
                object.groupings[array[i].category] = [];
                object.groupings[array[i].category].push([array[i].tag, array[i].tag_id]);
            } else {
                object.groupings[array[i].category].push([array[i].tag, array[i].tag_id]);
            }
        }
        return object;
    };

    this.submitProject = function(projectCategory, projectTags, projectName, projectDescription, projectDueDate, tagId) {
        var deferred = $q.defer();
        data = {
            projectCategory: projectCategory,
            projectTags: projectTags,
            projectName: projectName,
            projectDescription: projectDescription,
            projectDueDate: projectDueDate,
            tagId: tagId
        };
        $http.post("/clientProject/submitProject", data).then(function(response) {
            deferred.resolve(response);
        });
        return deferred.promise;
    };

    this.sortProjects = function(array) {
        var ongoingProjects = [];
        var completedProjects = [];
        var projectsInPool = [];
        for (i in array) {
            if (array[i].project_status == 0) {
                ongoingProjects.push(array[i]);
                console.log(ongoingProjects);
            }
        }

        for (j in array) {
            if (array[j].project_status == 1) {
                completedProjects.push(array[j]);

            }
        }

        for (k in array) {
            if (array[k].project_status == 2) {
                projectsInPool.push(array[k]);
            }
        }
        var data = {
            ongoingProjects: ongoingProjects,
            completedProjects: completedProjects,
            projectsInPool: projectsInPool
        };
        return data;

    };
}]);
app.controller("loginController", ["loginService", "$scope", function(loginService, $scope) {
    $scope.login = function() {
        data = {
            username: $scope.username,
            password: $scope.password
        }
        loginService.login(data).then(function(response) {
            if (response.err == 0) {
                window.location = "/client";
            } else {
                $scope.failed = true;
                $scope.successful = false;
            }
        });
    };

}]);

app.controller("clientHomeController", ["clientInformationService", "$scope", function(clientInformationService, $scope) {
    function getIdObject(object) {
        var idObject = {};
        for (k in object) {
            if (object.hasOwnProperty(k)) {
                idObject[k] = [];
                for (var i = 0; i < object[k].length; i++) {
                    idObject[k][i] = object[k][i][0].replace(/\s/g, "");
                    idObject[k][i] = idObject[k][i].replace(/\//g, "");
                }
            }
        }
        console.log(idObject);
        return idObject;
    }




    clientInformationService.getInfo().then(function(response) {
        $scope.clientInformation = response;
    });

    clientInformationService.getProjectInformation().then(function(response) {
        $scope.projects = clientInformationService.sortProjects(response);
        console.log($scope.projects);
    });

    clientInformationService.getCategories().then(function(response) {
        $scope.categories = clientInformationService.sortCategories(response);
        $scope.idObject = getIdObject($scope.categories.groupings);

        console.log($scope.categories);
    });

    $scope.submitProject = function(projectCategory, projectTags, projectName, projectDescription, projectDueDate, tagId) {
        if (projectName && projectDescription) {
            clientInformationService.submitProject(projectCategory, projectTags, projectName, projectDescription, projectDueDate, tagId);
        }
    };






}]);