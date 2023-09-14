
async function submitAddVehicleForm() {
    validateForm("add-vehicle-form").then(data => {
        if (data.validated) {
            postVehicle(data.data);
        }
    }).catch(err => console.log(err));

}


async function forceAddVehicle(evt) {
    compileForm($(evt).closest("form").serializeArray()).then(function (compiledData) {
        console.log(compiledData);
        postVehicle(compiledData);
    })
}






async function submitAddEmployeeForm(evt) {
    const formName = "add-employee-form";
    validateForm(formName).then(function (data) {
        if(data.validated){
            // console.log(data);
            // console.log("______SENT________");
            
            $.post("/employee", data.data, function (response, status) {
                if (status == "success") {
                    // console.log(response.err);
                    if (!response.err) {
                        if(response.added){
                            showSuccessfullMesage("add-employee-form", "Employee '<b>" + response.addedObj.firstName + "'</b> Added Successfully");
                        }else{
                            let formErrorDiv = $("#" + formName + "-error-div");
                            let formErrorMesages = $("#" + formName + "-error-messages");

                            formErrorMesages.append("<li class='mt-1 col-lg-4 col-md-6 col-sm-12 d-inline-block '>* Failed to add employee: 'unkwon error'</li>");
                            formErrorHeader.text("Error Adding Employee!");
                            formErrorDiv.addClass("show alert-danger").removeClass("d-none");
                        }
                        // return response;
                    } else {
                        let formErrorDiv = $("#" + formName + "-error-div");
                        let formErrorMesages = $("#" + formName + "-error-messages");

                        formErrorMesages.append("<li class='mt-1 col-lg-4 col-md-6 col-sm-12 d-inline-block '>* " + response.err + "</li>");
                        formErrorHeader.text("Error Adding Employee!");
                        formErrorDiv.addClass("show alert-danger").removeClass("d-none");
                        // return response
                    }
                } else {
                    // code to handle unable to reach server or make successfull requewsts
                    let formErrorDiv = $("#" + formName + "-error-div");
                    let formErrorMesages = $("#" + formName + "-error-messages");

                    formErrorMesages.append("<li class='mt-1 col-lg-4 col-md-6 col-sm-12 d-inline-block '>* " + response.err + "</li>");
                    formErrorHeader.text("Error Adding Employee!");
                    formErrorDiv.addClass("show alert-danger").removeClass("d-none");
                    // return {err:"Failed to make a succefull Request"};
                    // return response
                }
            }).catch(function(err){
                console.log(err);
            })
        
        


        }else{
            // console.log(data.data);
            console.log("cant post yet");
        }
    });
}

function forceAddEmployee(evt) {
    const formName = "add-employee-form";
    const formDetails = $("#"+formName).serializeArray();

    compileForm(formDetails).then(function (employee) {
        // console.log(employee);
        // postEmployee(employee).then((result) => {
        //     if (!result.err) {
        //         showSuccessfullMesage("add-employee-form","Employee '<em>" + result.firstName + "</em>' Added Successfully");
        //     }else {
        //         let formErrorDiv = $("#" + formName + "-error-div");
        //         let formErrorMesages = $("#" + formName + "-error-messages");

        //         formErrorMesages.append("<li class='mt-1 col-lg-4 col-md-6 col-sm-12 d-inline-block '>* " + result.err + "</li>");
        //         formErrorHeader.text("Error Adding Employee!");
        //         formErrorDiv.addClass("show alert-danger").removeClass("d-none");
        //     }
        $.post("/employee", employee, function (response, status) {
            if (status == "success") {
                // console.log(response.err);
                if (!response.err) {
                    if (response.added) {
                        showSuccessfullMesage("add-employee-form", "Employee '<b>" + response.addedObj.firstName + "'</b> Added Successfully");
                    } else {
                        let formErrorDiv = $("#" + formName + "-error-div");
                        let formErrorMesages = $("#" + formName + "-error-messages");

                        formErrorMesages.append("<li class='mt-1 col-lg-4 col-md-6 col-sm-12 d-inline-block '>* Failed to add employee: 'unkwon error'</li>");
                        formErrorHeader.text("Error Adding Employee!");
                        formErrorDiv.addClass("show alert-danger").removeClass("d-none");
                    }
                    // return response;
                } else {
                    let formErrorDiv = $("#" + formName + "-error-div");
                    let formErrorMesages = $("#" + formName + "-error-messages");

                    formErrorMesages.append("<li class='mt-1 col-lg-4 col-md-6 col-sm-12 d-inline-block '>* " + response.err + "</li>");
                    formErrorHeader.text("Error Adding Employee!");
                    formErrorDiv.addClass("show alert-danger").removeClass("d-none");
                    // return response
                }
            } else {
                // code to handle unable to reach server or make successfull requewsts
                let formErrorDiv = $("#" + formName + "-error-div");
                let formErrorMesages = $("#" + formName + "-error-messages");

                formErrorMesages.append("<li class='mt-1 col-lg-4 col-md-6 col-sm-12 d-inline-block '>* " + response.err + "</li>");
                formErrorHeader.text("Error Adding Employee!");
                formErrorDiv.addClass("show alert-danger").removeClass("d-none");
                // return {err:"Failed to make a succefull Request"};
                // return response
            }
        }).catch(function (err) {
            console.log(err);
        });
    }).catch((data) => console.log("ERR*: " + data));
}

async function postVehicle(vehicle) {
    await $.post("/vehicle", vehicle, function (response, status) {
        if (status == "success") {
            if (response != "bad request") {
                console.log(response);
            }
        } else {
            // code to handle unable to reach server or make successfull requewsts
        }
    })
};


async function postEmployee(employee) {
    let added = false;
    await $.post("/employee", employee, function (response, status) {
        if (status == "success") {
            // console.log(response.err);
            if (!response.err) {
                return response;
            } else {
                let formErrorDiv = $("#" + formName + "-error-div");
                let formErrorMesages = $("#" + formName + "-error-messages");

                formErrorMesages.append("<li class='mt-1 col-lg-4 col-md-6 col-sm-12 d-inline-block '>* " + response.err + "</li>");
                formErrorHeader.text("Error Adding Employee!");
                formErrorDiv.addClass("show alert-danger").removeClass("d-none");
                return response
            }
        } else {
            // code to handle unable to reach server or make successfull requewsts
            // return {err:"Failed to make a succefull Request"};
           return response
        }
    })
};






function showSuccessfullMesage(formName, htmlSuccessMessage) {
    console.log("sucees message function called");
    const form = $("#"+formName);
    const formSuccess = $("#"+formName + "-success");

    const p = formSuccess.find("p");
    p.html(htmlSuccessMessage)
    form.addClass("d-none").removeClass("d-block");
    formSuccess.removeClass("d-none").addClass("d-block");
}

async function submitDailyScheduleForm () {
    let body = { date: (new Date()).toLocaleDateString("en-us"), confirmed: $("#confirm-schedule").prop("checked"), attendance:[] };
 
    const rows = $("#daily-schedule-tbody").children("tr");
    for(row of rows) {
        
        let datas = $(row).children("td");

        let attendanceEntry = {
            workArea: $(datas[1]).text().trim(),
            driver: $(datas[2]).find(":selected").text().trim(),
            shift: $($(datas[3]).find(":selected")).text().trim()
        };

        if (attendanceEntry.shift != "OFF" && attendanceEntry.driver != "SELECT A DRIVER"){
            body.attendance.push(attendanceEntry);
        }
    }
    if(body.attendance.length > 0){
        // console.log(body);
        $.post("/dailySchedule", body, function(response, status) {
            if(status == "success"){
                if(!response.err){
                    if(response.added){
                        $("#daily-schedule-error-messages").empty();
                        $("#daily-schedule-error-messages").append("<li>Daily Schedule Saved</li>");
                        $("#daily-schedule-error-div").addClass("show d-block alert-success").removeClass("d-none alert-warning");
                    }
                    console.log(response);
                }else{
                    console.log(response.err);
                    $("#daily-schedule-error-messages").empty();
                    $("#daily-schedule-error-messages").append("<li>"+response.err+"</li>");
                    $("#daily-schedule-error-div").addClass("show d-block alert-warning").removeClass("d-none alert-success");
                }
            }else{
                console.log("unable to connect to server");
            }
        })
    }
}

async function validateForm(formName) {
    const formDetails = $("#" + formName).serializeArray();
    let warning = 0;
    let postable = false;
    let processedData = { "postable": false };
    let formErrorDiv = $("#" + formName + "-error-div");
    let formErrorMesages = $("#" + formName + "-error-messages");
    let formErrorHeader = $("#" + formName + "-error-header");
    let formSubmit = $("#" + formName + "-submit");
    let formConfirmDiv = $("#" + formName + "-confirm-div");
    let formConfirm = $("#" + formName + "-confirm");

    let required = 0;
    let requiredCompleted = 0;

    formErrorMesages.empty();
    await formDetails.map(function (data) {
        let element = $("#" + data.name);
        if (element.prop("required")) {
            required++;
            if (data.value && data.value != "null") {
                $("#" + data.name).removeClass("border-danger").addClass("border-success")
                requiredCompleted++;
            } else {
                $("#" + data.name).addClass("border-danger");
                formErrorMesages.append("<li class='mt-1 col-lg-4 col-md-6 col-sm-12 d-inline-block '>* " + $("#" + data.name).attr("info") + "</li>");
            }
        }
    })

    if (required == requiredCompleted) {
        postable = true;
        await formDetails.map(function (data) {
            // console.log(data);
            if (data.value && data.value != "null") {
                const rawKey = data.name.split('-');
                const key1 = rawKey.shift();
                const key2 = rawKey.map(k => k[0].toUpperCase() + k.substr(1)).join("");
                processedData[key1+key2] = data.value;
                $("#" + data.name).hasClass("border-warning") && $("#" + data.name).removeClass("border-warning").addClass("border-success");
            } else {
                if ($("#" + data.name).attr("in-play") == undefined) {
                    !($("#" + data.name).hasClass("border-warning")) && $("#" + data.name).addClass("border-warning").removeClass("border-success");
                    formErrorMesages.append("<li class='mt-1 col-lg-4 col-md-6 col-sm-12 d-inline-block'>* " + $("#" + data.name).attr("info") + "</li>");
                    warning++;
                    const rawKey = data.name.split('-');
                    const key1 = rawKey.shift();
                    const key2 = rawKey.map(k => k[0].toUpperCase() + k.substr(1)).join("");
                    processedData[key1 + key2] = data.value;
                } else if (($("#" + data.name).attr("in-play") == "true")) {
                    !($("#" + data.name).hasClass("border-warning")) && $("#" + data.name).addClass("border-warning").removeClass("border-success");
                    formErrorMesages.append("<li class='mt-1 col-lg-4 col-md-6 col-sm-12 d-inline-block '>* " + $("#" + data.name).attr("info") + "</li>");
                    warning++;
                    const rawKey = data.name.split('-');
                    const key1 = rawKey.shift();
                    const key2 = rawKey.map(k => k[0].toUpperCase() + k.substr(1)).join("");
                    processedData[key1 + key2] = data.value;
                }
            }
        });
        if (warning) {
            formErrorHeader.text("Warning - Do you wish to proceed without correcting these?");
            formConfirmDiv.removeClass("d-none");
            formSubmit.text("Revalidate and Submit");

            // $("#add-vehicle-error").removeClass("alert-danger").addClass("alert-warning");
            formErrorDiv.addClass("show alert-warning").removeClass("d-none alert-danger");
            return { "data": processedData, "postable": postable, "validated": false };
        } else {
            formConfirmDiv.addClass("d-none");
            formSubmit.text("Add Employee").removeClass("btn-primary").addClass(" btn-outline-success disabled");
            formErrorDiv.removeClass("show").addClass("d-none");
            return { "data": processedData, "postable": postable, "validated": true };
        }
    } else {
        postable = false;
        formErrorHeader.text("Please Correct the following errors!");
        formErrorDiv.addClass("show alert-danger").removeClass("d-none");
        return { "data": processedData, "postable": postable, "validated": false };
    }
}

async function compileForm(formDetails) {
    let data = {};
    await formDetails.map(function (detail) {
        const rawKey = detail.name.split('-');
        const key1 = rawKey.shift();
        const key2 = rawKey.map(k => k[0].toUpperCase() + k.substr(1)).join("");
        // processedData[key1 + key2] = data.value;
        data[key1+key2] = detail.value;
    });
    return data;
}