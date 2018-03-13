var express = require("express");
var mysql = require("mysql");
var bodyParser = require("body-parser");
var sjcl = require("sjcl");
var session = require("express-session");
var nodemailer = require("nodemailer");
var app = express();
var http = require('http').Server(app);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
var connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "softservices"
});
var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: 'softservicesng@gmail.com',
        pass: 'softservices'
    }
})
var adminHomeRouter = express.Router();
var adminUserRouter = express.Router();
var adminProjectRouter = express.Router();
var adminChatRouter = express.Router();
var adminLoginRouter = express.Router();
var clientHomeRouter = express.Router();
var clientLoginRouter = express.Router();
var clientProjectRouter = express.Router();
app.use(session({ secret: "wriwoewewssm2wersa39903" }));
app.use("/admin", adminHomeRouter);
app.use("/adminUser", adminUserRouter);
app.use("/adminProject", adminProjectRouter);
app.use("/adminChats", adminChatRouter);
app.use("/adminLogin", adminLoginRouter);
app.use("/client", clientHomeRouter);
app.use("/clientLogin", clientLoginRouter);
app.use("/clientProject", clientProjectRouter);
app.use("/staticcontent", express.static("./static/admin-lte"));

adminLoginRouter.get("/", function(req, res) {
    if (req.session.adminId) {
        res.sendfile("./static/accountManagement.html");
    } else {
        res.sendfile("./static/adminLogin.html");
    }
})
adminLoginRouter.post("/", function(req, res) {
    var userEmail = req.body.userEmail || "";
    var userPassword = req.body.userPassword || "";
    data = {
        err: 1,
        res: ""
    }

    connection.query("SELECT * FROM users WHERE user_email=? AND user_password=?", [userEmail, userPassword], function(err, res1, rows) {
        if (err) {
            data.res = "Problem logging in";
            console.log(err);
            res.json(data);
        } else {
            if (res1[0] && res1[0].user_type == "F") {
                console.log(res1);
                req.session.userEmail = res1[0].user_email;
                req.session.adminId = req.session.userId = res1[0].user_id;
                req.session.adminRoleId = res1[0].user_role_id;
                data.err = 0;
                data.res = "Login Successful";
                res.json(data);
            } else {
                data.res = "Incorrect Username/ Password";
                res.json(data);
            }
        }
    });
});

adminLoginRouter.post("/logout", function(req, res) {
    if (req.session.adminId) {
        req.session.adminId = null;
        res.send();
    }
});

adminHomeRouter.get("/", function(req, res) {
    if (req.session.adminId) {
        res.sendfile("./static/admin-lte/index.html");
    } else {
        res.redirect("/adminLogin");
    }
});

adminHomeRouter.get("/addProject", function(req, res) {
    if (req.session.adminId) {
        res.sendfile("./static/admin-lte/addProject.html");
    } else {
        res.redirect("/adminLogin");
    }
});

adminUserRouter.post("/userinfo", function(req, res) {
    if (req.session.adminId) {
        var adminId = req.session.adminId;
        var data = {
            err: 1,
            res: ""
        }
        connection.query("SELECT * FROM users WHERE user_id= ?", [adminId], function(err, res1, rows) {
            if (err) {
                data.res = "Error in Code " + err;
                console.log(data);
                res.json(data);
            } else {
                data.err = 0;
                console.log(data);
                data.res = res1;
                res.json(data);
            }
        });
    } else {
        res.redirect("/adminLogin");
    }
});

adminProjectRouter.get("/projectsInPool", function(req, res) {
    var data = {
        err: 1,
        res: ""
    };
    console.log(req.session.adminRoleId);
    connection.query("SELECT * FROM projects WHERE project_status= 2 AND project_tag_id=?", [req.session.adminRoleId], function(err, res1, rows) {
        if (err) {
            data.res = err;
            res.json(data);
        } else {
            data.err = 0;
            data.res = res1;
            res.json(data);

        }
    });
});
adminProjectRouter.post("/projectinfo", function(req, res) {
    if (req.session.adminId) {
        var adminId = req.session.adminId;
        var data = {
            err: 1,
            res: ""
        };
        connection.query("SELECT * FROM projects WHERE project_assigned_to=?", [adminId], function(err, res1, rows) {
            if (err) {
                data.res = "Error in Code" + err;

                res.json(data);

            } else {
                data.err = 0;
                data.res = res1;

                res.json(data);
            }
        });
    } else {
        res.redirect("/adminLogin");
    }
});
adminProjectRouter.post("/addProject", function(req, res) {
    var data = {
        err: 1,
        res: ""
    }
    var project = req.body.project;
    connection.query("UPDATE projects SET project_assigned_to=?, project_status=? WHERE project_id=?", [req.session.adminId, 0, project.project_id], function(err, res1, rows) {
        if (err) {
            data.res = err;
            res.json(data);
        } else {
            data.err = 0;
            data.res = "Successful";
            connection.query("SELECT user_email, user_first_name FROM users WHERE user_id=?", [project.project_assigned_by], function(err1, res2, rows1) {
                if (err1) {
                    data.res = err1;
                    res.json(data);
                } else {
                    var emailText = "Dear " + res2[0].user_first_name + ",\n \n Your project titled '" + project.project_name + "' has been picked up by " + req.session.userEmail + ". You may contact him for further negotiations directly by email or through the SoftServicesNG chat screen.\n \n Thank you for choosing SoftServicesNG.";
                    var mailOptions = {
                        from: 'SoftServicesNG@gmail.com',
                        to: res2[0].user_email,
                        subject: 'Service Request Picked Up - SoftServicesNG',
                        text: emailText
                    };

                    transporter.sendMail(mailOptions, function(error, info) {
                        if (error) {
                            console.log(error);
                        } else {
                            console.log('Email sent: ' + info.response);
                        }
                    });
                    res.json(data);
                }
            });

        }
    });
});
adminProjectRouter.post("/updateProjectProgress", function(req, res) {
    if (req.session.adminId) {
        var projects = req.body.projects;
        var data = {
            err: 1,
            res: ""
        }

        function updateProgress() {
            for (var i = 0; i < projects.length; i++) {
                connection.query("UPDATE projects SET project_progress=? WHERE project_id=?", [projects[i].project_progress, projects[i].project_id], function(err, res1) {
                    if (err) {
                        data.res = "There was an error updating progress";
                        data.err = 1;
                        console.log(err);
                        return data;
                    } else {
                        data.res = "Progress update successful"
                        data.err = 0;
                    }
                });
            }
            return data;
        }

        function sendResponse() {
            data = updateProgress();
            res.json(data);
        }
        sendResponse();
    } else {
        res.redirect("/adminLogin");
    }
});

adminChatRouter.post("/getMessages", function(req, res) {
    if (req.session.adminId) {
        var projectId = req.body.projectId;
        var data = {
            err: 1,
            res: ""
        };

        connection.query("SELECT * FROM messages WHERE project_id=?", [projectId], function(err, res1, rows) {
            if (err) {
                data.res = "Error in Code " + err;
                res.json(data);
            } else {
                data.err = 0;
                data.res = res1;
                res.json(data);
            }
        });
    } else {
        res.redirect("/adminLogin");
    }
});

adminChatRouter.post("/sendMessages", function(req, res) {
    if (req.session.adminId) {
        var projectId = req.body.projectId;
        var adminId = req.session.adminId;
        var messageToSend = req.body.messageToSend;
        var messageTo = req.body.messageTo;

        function datePicker() {
            var rawDate = new Date();
            var date = rawDate.getFullYear() + "-" + rawDate.getMonth() + "-" + rawDate.getDate() + " " + rawDate.getHours() + ":" + rawDate.getMinutes() + ":" + rawDate.getSeconds();
            return rawDate;
        }
        console.log(projectId);
        console.log(messageTo);
        connection.query("SELECT user_email FROM users WHERE user_id=?", [messageTo], function(err, res1, rows) {

            if (!err && res1) {
                console.log(res1);
                var recipientEmail = res1[0].user_email;
                connection.query("SELECT user_email FROM users WHERE user_id=?", [adminId], function(err, res2, rows) {
                    if (!err) {
                        var senderEmail = res2[0].user_email;
                        connection.query("SELECT project_id ,message_id, message_from, message_content FROM messages WHERE project_id=? ORDER BY message_id DESC LIMIT 1", [projectId], function(err, res3, rows) {
                            if (res3.length != 0 && res3[0].message_from == adminId && res3[0].project_id == projectId) {
                                var newMessage = res3[0].message_content + "\n" + messageToSend;
                                console.log(newMessage);
                                var messageId = res3[0].message_id;
                                console.log(messageId);
                                connection.query("UPDATE messages SET message_content=?, message_date=? WHERE message_id=?", [newMessage, datePicker(), messageId], function(err, res4) {
                                    if (!err) {
                                        console.log("INSERT COMPLETED");
                                        res.json({ response: 1 });
                                    } else {
                                        console.log(err);
                                        res.json({ response: 0 });
                                    }
                                });
                            } else {
                                connection.query("INSERT INTO messages (project_id, message_to, message_from, message_content, message_to_email, message_from_email, message_date) VALUES (?, ?, ?, ?, ?, ?, ?)", [projectId, messageTo, adminId, messageToSend, recipientEmail, senderEmail, datePicker()], function(err, res3) {
                                    if (!err) {
                                        console.log("INSERT COMPLETED");
                                        res.json({ response: 1 });
                                    } else {
                                        console.log(err);
                                        res.json({ response: 1 });
                                    }
                                });

                            }
                        });
                    } else {
                        console.log(err);
                        res.json({ response: 1 });
                    }
                });
            } else {
                console.log(err);
                res.json({ response: 1 });
            }

        });
    } else {
        res.redirect("/adminLogin");
    }
});

clientHomeRouter.get("/", function(req, res) {
    if (req.session.adminId || req.session.clientId) {
        res.sendfile("./static/clientPortal.html");
    } else {
        res.sendfile("./static/clientLogin.html");
    }
});

clientHomeRouter.get("/info", function(req, res) {
    if (req.session.adminId || req.session.clientId) {
        var userId = req.session.adminId || req.session.clientId;
        var data = {
            err: 1,
            res: ""
        }
        connection.query("SELECT * FROM users WHERE user_id = ?", [userId], function(err, res1, rows) {
            if (err) {
                data.res = err;
                res.json(data);
            } else {
                data.err = 0;
                data.res = res1;
                console.log(data);
                res.json(data);
            }
        });
    }
});

clientHomeRouter.get("/categoryInfo", function(req, res) {
    if (req.session.adminId || req.session.clientId) {
        var data = {
            err: 1,
            res: ""
        }
        connection.query("SELECT * FROM tags", function(err, res1, rows) {
            if (err) {
                data.res = err;
                res.json(data);
            } else {
                data.err = 0;
                data.res = res1;
                console.log(data);
                res.json(data);
            }
        });
    }
});

clientProjectRouter.get("/projectInfo", function(req, res) {
    if (req.session.adminId || req.session.clientId) {
        var userId = req.session.adminId || req.session.clientId;
        var data = {
            err: 1,
            res: ""
        };
        connection.query("SELECT * FROM projects WHERE project_assigned_by = ?", [userId], function(err, res1, rows) {
            if (err) {
                data.res = err;
                res.json(data);
            } else {
                data.err = 0;
                data.res = res1;
                console.log(data);
                res.json(data);
            }
        });
    }
});

clientProjectRouter.post("/submitProject", function(req, res) {
    if (req.session.adminId || req.session.clientId) {
        var data = {
            err: 1,
            res: ""
        };
        var userId = req.session.adminId || req.session.clientId;
        var projectName = req.body.projectName;
        var projectDueDate = req.body.projectDueDate;
        var projectDescription = req.body.projectDescription;
        var projectCategory = req.body.projectCategory;
        var projectTags = req.body.projectTags;
        var tagId = req.body.tagId;

        connection.query("INSERT INTO projects SET project_name=?, project_assigned_by =?, project_assigned_to=?, project_category=?, project_tags=?, project_description=?, project_due_date=?, project_progress=?, project_status=?, project_tag_id=? ", [projectName, userId, 3, projectCategory, projectTags, projectDescription, projectDueDate, 0, 2, tagId], function(err, res1) {
            if (err) {
                data.res = "";
                console.log(err);
                res.json(data);
            } else {
                data.res = "Successful";
                res.json(data);
            }
        });

    }
});

clientLoginRouter.get("/", function(req, res) {
    res.sendfile("./static/clientLogin.html");
});

clientLoginRouter.post("/", function(req, res) {
    var userEmail = req.body.username;
    var userPassword = req.body.password;
    var data = {
        err: 1,
        res: ""
    }
    connection.query("SELECT * FROM users WHERE user_email=? AND user_password=?", [userEmail, userPassword], function(err, res1, rows) {
        if (err) {
            data.res = "Problem logging in";
            console.log(err);
            res.json(data);
        } else {
            if (res1[0] && res1[0].user_type == "F") {
                console.log(res1);
                req.session.userEmail = res1[0].user_email;
                req.session.adminId = res1[0].user_id;
                data.err = 0;
                data.res = "Login Successful";
                res.json(data);
            } else if (res1[0]) {
                req.session.userEmail = res1[0].user_email;
                req.session.clientId = res1[0].user_id;
                data.err = 0;
                data.res = "Login Successful";
                res.json(data);
            } else {
                data.res = "Incorrect Username/ Password";
                res.json(data);
            }
        }
    });
});
app.listen(3000);