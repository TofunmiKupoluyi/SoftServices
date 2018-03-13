var app = angular.module("myApp", ["ngStorage"]);
app.service("loginService", function($q, $http) {
    this.login = function(data) {
        var deferred = $q.defer();
        $http.post("/adminLogin", data).then(function(response) {
            deferred.resolve(response.data);
        });
        return deferred.promise;
    }
    this.logout = function() {
        $http.post("/adminLogin/logout");
    };
});

app.service("userInformationService", function($q, $http) {
    var deferred = $q.defer();
    this.getUserInformation = function(data) {
        $http.post("/adminUser/userinfo", data).then(function(response) {
            deferred.resolve(response.data);
        });

        return deferred.promise;
    };
});
app.service("projectInformationService", function($q, $http, chatInformationService) {
    var deferred = $q.defer();

    function parseDate(dateString) {
        var myDate = new Date(dateString);
        return myDate.toDateString();
        // var months = ['01','02','03','04','05','06','07','08','09','10','11','12'];
        // var parsedDate= myDate.getFullYear()+"-"+months[myDate.getMonth()]+"-"+myDate.getDate()+" | "+myDate.getHours()+":"+myDate.getMinutes();
        // return parsedDate.toString();
    }

    function updateProjectProgress(projects) {
        for (var i = 0; i < projects.length; i++) {
            if (projects[i].progress_update) {
                projects[i].project_progress = projects[i].progress_update;
                delete projects[i].progress_update;
            }
        }
        return projects;
    }

    this.getProjectInformation = function() {
        $http.post("/adminProject/projectinfo").then(function(response) {
            deferred.resolve(response.data);
        });
        return deferred.promise;
    };

    this.getCompletedProjects = function(data) {
        var deferred = $q.defer();
        var resolvedData = [];
        for (var i = 0; i < data.length; i++) {
            if (data[i].project_status == 1) {
                resolvedData.push(data[i]);
            }
        }
        deferred.resolve(resolvedData);
        return deferred.promise;
    };

    this.getOngoingProjects = function(data) {
        var deferred = $q.defer();
        var resolvedData = [];
        for (var i = 0; i < data.length; i++) {
            if (data[i].project_status == 0) {
                resolvedData.push(data[i]);
            }
        }
        deferred.resolve(resolvedData);
        return deferred.promise;
    };

    this.getCancelledProjects = function(data) {
        var deferred = $q.defer();
        var resolvedData = [];
        for (var i = 0; i < data.length; i++) {
            if (data[i].project_status == 3) {
                resolvedData.push(data[i]);
            }
        }
        deferred.resolve(resolvedData);
        return deferred.promise;
    };

    this.getProjectsInPool = function(data) {
        var deferred = $q.defer();
        $http.get("/adminProject/projectsInPool").then(function(response) {
            deferred.resolve(response.data.res);
        });
        return deferred.promise;
    };
    this.getProjectAssigneeByProjectId = function(projects, projectId) {
        var deffered = $q.promise;
        for (var i = 0; i < project.length; i++) {
            if (projects[i].project_id == projectId) {
                var projectAssignedBy = projects[i].project_assigned_by;
                deferred.resolve(projectAssignedBy);
            }
        }
        return deferred.promise;
    }
    this.formatProjectDueDates = function(projects) {
        var deferred = $q.defer();
        for (var i = 0; i < projects.length; i++) {
            projects[i].project_due_date = parseDate(projects[i].project_due_date);

        }
        deferred.resolve(projects);
        return deferred.promise;
    };

    this.sendUpdatedProgress = function(projects) {
        projects = updateProjectProgress(projects);
        var deferred = $q.defer();
        var data = {
            projects: projects
        }
        $http.post("/adminProject/updateProjectProgress", data).then(function(res) {
            var returnStatement = {
                res: res,
                projects: projects
            }
            deferred.resolve(returnStatement);
        });

        return deferred.promise;
    };
    this.addProject = function(project) {
        var deferred = $q.defer();
        var data = {
            project: project
        };
        $http.post("/adminProject/addProject", data).then(function(response) {
            deferred.resolve(response);
        });
        return deferred.promise;
    }
});

app.service("chatInformationService", function($q, $http) {
    function parseDate(dateString) {
        var myDate = new Date(dateString);
        return myDate.toUTCString();
        // var months = ['01','02','03','04','05','06','07','08','09','10','11','12'];
        // var parsedDate= myDate.getFullYear()+"-"+months[myDate.getMonth()]+"-"+myDate.getDate()+" | "+myDate.getHours()+":"+myDate.getMinutes();
        // return parsedDate.toString();
    }
    this.getMessages = function(projectId) {
        var deferred = $q.defer();
        var data = { projectId: projectId };
        $http.post("/adminChats/getMessages", data).then(function(response) {
            deferred.resolve(response);
        });
        return deferred.promise;
    };
    this.sendMessages = function(userId, projectId, messageToSend, messageTo) {
        var deferred = $q.defer();
        var data = {
            projectId: projectId,
            messageToSend: messageToSend,
            messageTo: messageTo,
            userId: userId
        };
        console.log(data);
        $http.post("/adminChats/sendMessages", data).then(function(response) {
            deferred.resolve(response);
        });
        return deferred.promise;
    };

    this.formatMessageDates = function(messages) {
        var deferred = $q.defer();
        for (var i = 0; i < messages.length; i++) {
            messages[i].message_date = parseDate(messages[i].message_date);
        }
        deferred.resolve(messages);
        return deferred.promise;
    };


});

app.controller("userInfoController", function($scope, userInformationService, loginService) {
    var userId = 2;
    $scope.userId = userId;
    var data = { userId: $scope.userId };
    $scope.logout = function() {
        loginService.logout();
        window.location = "/adminLogin";
    }
    userInformationService.getUserInformation(data).then(function(response) {
        $scope.userDetails = response.res[0];
        $scope.userName = response.res[0].user_first_name + " " + response.res[0].user_last_name;
        console.log(response.res[0]);
    });
});

app.controller("projectInfoController", function($scope, projectInformationService, $timeout) {
    function getProjects() {
        projectInformationService.getProjectInformation().then(function(response) {
            var projectDetails = response.res;
            $scope.totalProjects = projectDetails;

            projectInformationService.getCompletedProjects(projectDetails).then(function(response) {
                $scope.completedProjects = response;
            });

            projectInformationService.getOngoingProjects(projectDetails).then(function(response) {
                $scope.ongoingProjects = response;
            });

            projectInformationService.getProjectsInPool(projectDetails).then(function(response) {
                console.log(response);
                $scope.projectsInPool = response;

            });
            projectInformationService.getCancelledProjects(projectDetails).then(function(response) {
                $scope.cancelledProjects = response;
            });
        });
    }
    getProjects();
    $scope.adjustProjectProgress = function() {
        $scope.editProgressBox = true;
    }
    $scope.editProgressBoxFunction = function() {
        $scope.editProgressBox = !($scope.editProgressBox);
    }
    $scope.ongoingProjectModalOpened = function() {
        $scope.editProgressBox = false;
        $scope.projectSubmitButton = false;
        $scope.projectUpdateComplete = false;
    }
    $scope.projectProgressUpdated = function() {
        console.log("Project Updated");
        $scope.projectSubmitButton = true;
        $scope.projectUpdateComplete = false;
    }
    $scope.submitProjectUpdate = function() {
        projectInformationService.sendUpdatedProgress($scope.ongoingProjects).then(function(res) {
            console.log(res);
            $scope.ongoingProjects = res.projects;
            $scope.projectSubmitButton = false;
            $scope.projectUpdateComplete = true;
            $scope.editProgressBox = false;
        });
        $("#ongoingModal").modal("hide");
        setTimeout(function() { $("#ongoingModal").modal("show"); }, 1000)

    };
    $scope.openAddProjectModal = function(x) {
        $scope.projectToBeAdded = x;
    };

    $scope.addProject = function(x) {
        projectInformationService.addProject(x);
    };
});

app.controller("chatboxController", function($scope, chatInformationService, projectInformationService, $timeout, $sessionStorage) {

    $scope.currentProject = 0;
    var assignedProjectId = 1;

    projectInformationService.getProjectInformation().then(function(response) {
        var projectDetails = response.res;
        projectInformationService.getOngoingProjects(projectDetails).then(function(response) {
            console.log(response);
            projectInformationService.formatProjectDueDates(response).then(function(response) {
                $scope.ongoingProjects = response;
            });

            chatInformationService.getMessages(response[0].project_id).then(function(response1) {
                chatInformationService.formatMessageDates(response1.data.res).then(function(response) {
                    $scope.messages = response;
                });

                $scope.currentProject = response[0].project_id;
                if (!($sessionStorage.currentProject)) {
                    $sessionStorage.currentProject = response[0].project_id;
                }
                $scope.assignee = response[0].project_assigned_by;
                console.log(response1.data.res);
            });
        });
    });



    $scope.getMessages = function(projectId) {
        $scope.currentProject = projectId;
        $sessionStorage.currentProject = projectId;
        assignedProjectId = projectId;
        console.log(projectId);
        console.log($sessionStorage.currentProject);
        projectInformationService.getProjectInformation().then(function(response) {
            var projectDetails = response.res;
            projectInformationService.getOngoingProjects(projectDetails).then(function(response) {
                projectInformationService.formatProjectDueDates(response).then(function(response) {
                    $scope.ongoingProjects = response;
                });
                projectInformationService.getProjectAssigneeByProjectId(response, projectId).then(function(response) {
                    $scope.assignee = response;
                });
            });
        });
        chatInformationService.getMessages(projectId).then(function(response) {
            chatInformationService.formatMessageDates(response.data.res).then(function(response) {
                $scope.messages = response;
            });


            setTimeout(function() { location.hash = "chat" }, 100);
        });
    };

    $scope.sendMessages = function(userId, projectId, messageToSend, messageTo) {
        console.log("BUTTON CLICKED");
        chatInformationService.sendMessages(userId, projectId, messageToSend, messageTo).then(function(response) {
            // chatInformationService.getMessages(projectId).then(function(response1){
            //     chatInformationService.formatMessages(response1.data.res).then(function(response){
            //         $scope.messages= response;
            //     });
            // });
            $scope.messageToSend = "";
        });
    };

    $scope.reload = function() {
        chatInformationService.getMessages($sessionStorage.currentProject).then(function(response) {
            chatInformationService.formatMessageDates(response.data.res).then(function(response) {
                $scope.messages = response;
            });
            $scope.currentProject = $sessionStorage.currentProject;
        });

        $timeout(function() {
            $scope.reload();
        }, 3000);

    };
    $scope.reload();



});

app.controller("calendarController", function($scope, projectInformationService, $timeout) {

    //Actual logic starts here

    $("#calendar").datepicker();

    function determineProjectsDueToday() {
        var dateStringOfSelectedDate = new Date().toDateString();
        $scope.actualProjectsDueToday = [];
        for (var i = 0; i < $scope.ongoingProjects.length; i++) {
            if ($scope.ongoingProjects[i].project_due_date == dateStringOfSelectedDate) {
                $scope.actualProjectsDueToday.push($scope.ongoingProjects[i]);
            }
        }
        $timeout(function() {
            determineProjectsDueToday();
        }, 50000);
    }

    projectInformationService.getProjectInformation().then(function(response) {
        var projectDetails = response.res;
        projectInformationService.getOngoingProjects(projectDetails).then(function(response) {
            projectInformationService.formatProjectDueDates(response).then(function(response) {
                $scope.ongoingProjects = response;
                setTimeout(function() {
                    $("#calendar").datepicker("setDate", new Date());
                    determineProjectsDueToday();
                }, 200);

                console.log($scope.ongoingProjects);
            });
        });
    });

    $("#calendar").datepicker().on("changeDate", function() {
        var date = $("#calendar").data("datepicker").getFormattedDate('yyyy-mm-dd');
        var dateStringOfSelectedDate = new Date(date).toDateString();
        $scope.completed = false;
        $scope.$apply();
        $scope.dueToday = [];
        $scope.dueLater = [];
        $scope.overdue = [];
        for (var i = 0; i < $scope.ongoingProjects.length; i++) {
            if ($scope.ongoingProjects[i].project_due_date == dateStringOfSelectedDate) {;
                $scope.dueToday.push($scope.ongoingProjects[i]);
            } else if ((new Date(dateStringOfSelectedDate).getTime()) < (new Date($scope.ongoingProjects[i].project_due_date).getTime())) {
                $scope.dueLater.push($scope.ongoingProjects[i]);
            } else {;
                $scope.overdue.push($scope.ongoingProjects[i]);
            }
        }
        $scope.completed = true;
    });

    $scope.setScroll = function() {
        return !($scope.completed);
    }

});

app.controller("loginController", function($scope, loginService) {
    $scope.login = function(username, password) {
        data = { userEmail: username, userPassword: password };
        loginService.login(data).then(function(response) {
            if (response.err == 0) {
                window.location = "/adminLogin";
            } else {
                $scope.failed = true;
                $scope.successful = false;
            }
        });
    };

    $scope.logout = function() {
        loginService.logout();
        window.location = "/adminLogin";
    }
});