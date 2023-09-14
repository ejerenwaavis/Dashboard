var globalEmployees = {};
var globalWA = {};
var globalVehicles = {};
var floaterCount = 0;

$().ready(function () {
    $(".all").on("click", handleCheck);
    $(".single-check").on("click", handleSingleChecks);
    prepareAddVehicleForm().catch(function (err) { console.log(err); });
    prepareAddEmployeeForm().catch(function (err) { console.log(err); });
    refreshEmployeeTable();
    prepareDailyScheduleForm();
})






/*************** Add Vehicle *********************/

async function prepareAddVehicleForm() {
    const thisYear = new Date().getFullYear();
    $("#make-year").append("<option value='" + (thisYear) + "'>" + thisYear + "</option>");
    for (i = 0; i < 22; i++) {
        $("#make-year").append("<option value='" + (thisYear - i) + "'>" + (thisYear - i) + "</option>");
    }
    $.get("/trucks/makes", function (data, status) {
        // console.log(data);
        if (status == "success") {
            data.forEach(make => {
                $("#make").append("<option value='" + make.make + "'> " + make.make + " </option>");
            });
            $("#make").append("<option value='add model'> Add New Make </option>");
        } else {
            $("#make").append("<option value='reload'> *error: try reloading </option>");
        }
    })
    $.get("/boxtypes", function (data, status) {
        if (status == "success") {
            data.sort(function (a, b) {
                if (a.boxTypeLower != "truck" || b.boxTypeLower != "truck") {
                    const aval = Number(a.boxTypeLower.replace("p", ""));
                    const bval = Number(b.boxTypeLower.replace("p", ""));
                    // console.log(aval+","+bval);
                    if (aval > bval) {
                        return 1;
                    } else if (aval == bval) {
                        return 0;
                    } else {
                        return -1
                    }
                } else {
                    return 1;
                }
            })
            data.forEach(item => {
                $("#box-type").append("<option value='" + item.boxType + "'> " + item.boxType + " </option>");
            });
            $("#box-type").append("<option value='add box type'> Add New Type </option>");
        }
    })
}

async function loadModel(evt) {
    const make = $(evt).val();
    if (make == "null") {
        // console.log("null");
        $("#new-make-div").addClass("d-none");
        $("#model-div").removeClass("d-none");
        $("#new-make").attr("in-play", "false");
        $("#new-model").attr("in-play", "false");

    } else if (make == "add model") {
        // console.log("add model");
        $("#new-make-div").removeClass("d-none");
        $("#new-make").attr("in-play", "true");
        $("#new-model").attr("in-play", "true");

        $("new-make").focus();
        $("#model-div").addClass("d-none");
    } else {
        $("#model-div").removeClass("d-none");
        $("#new-make-div").addClass("d-none");
        $("#new-make").attr("in-play", "false");
        $("#new-model").attr("in-play", "false");
        await $.get("/trucks/" + make + "/models", function (data, status) {
            if (status == "success") {
                $("#model").html("<option value=null selected>Select Model</option>");
                // console.log(data);
                data.forEach(model => {
                    $("#model").append("<option value='" + model + "'> " + model + " </option>");
                })
                $("#model").prop("disabled", false);
            } else {
                $("#model").append("<option value='reload'> -- Retry Loading-- </option>");
            }
        })
    }

}



function handleBoxType(evt) {
    const selection = $(evt).val();
    // console.log(selection);
    if (selection == "add box type") {
        $("#new-box-type-div").removeClass("d-none")
        $("#new-box-type").attr("in-play", "true");

    } else {
        $("#new-box-type-div").addClass("d-none")
        $("#new-box-type").attr("in-play", "false");
    }
}

function toggleExpandButton(evt) {
    var element = $(evt);
    const chevron = element.children("a").find(".toggle-expand-button");
    chevron.toggleClass("flip-y");
};


function handleCheck(evt) {
    var element = $(evt.target);
    if (element.prop("checked")) {
        checkAll(element);
    } else {
        uncheckAll(element);
    }
}

function checkAll(element) {
    element.parent().parent().find(':checkbox').each(function () {
        $(this).prop('checked', true);

    });
}


function uncheckAll(element) {
    element.parent().parent().find(':checkbox').each(function () {
        $(this).prop('checked', false);
    });
}


async function handleSingleChecks(evt) {
    var mainElement = $(evt.target);
    var elementGrandParent = mainElement.parent().parent();
    var elementColleagues = mainElement.parent().parent().find(":checkbox");
    let count = 0;
    await elementColleagues.each(function () {
        if ($(this).prop("checked")) {
            count++;
            // console.log("...");
        }
    });
    if (count === elementColleagues.length) {
        checkAll(elementGrandParent);
    } else {
        elementGrandParent.parent().parent().find(":checkbox.all").prop("checked", false);
    }
}



/****************** Add Employee *********************/
function handleJobType(evt) {
    const check = $(evt);
    if (check.prop("checked")) {
        $("#full-time").addClass("fw-bold").removeClass("text-muted fw-light");
        $("#part-time").addClass("fw-light text-muted").removeClass("fw-bold");
    } else {
        $("#full-time").addClass("fw-light text-muted").removeClass("fw-bold");
        $("#part-time").addClass("fw-bold").removeClass("text-muted fw-light");
    }
}

function handleRole(evt) {
    const role = $(evt).find(":selected").text();
    if (!role.includes("Driver")) {
        for (opt of $("#employee-work-area").find("option")) {
            if ($(opt).prop("selected")) {
                $(opt).removeAttr("selected")
                // console.log(opt.text);
            }
        }
        $("#floater").attr("selected", "");
    }
}


async function prepareAddEmployeeForm() {
    const waOptions = $("#employee-work-area");
    waOptions.empty();
    waOptions.append("<option id=" + "WA#" + " value=" + "null" + " >" + "WA#" + "</option>")
    await $.get("/wa", function (response, status) {
        if (status == "success") {
            if (response && response != false) {
                for (let wa of response) {
                    waOptions.append("<option id=" + wa.name + " value=" + wa.name + " >" + wa.name + "</option>")
                }
            } else {
                console.log("unable to load WA's : " + response);
            }
        } else {
            // Handle Unable to load Work Areas
            console.log("unable to load WA's : " + response);
        }
    })
    $("#add-employee-form .form-control").removeClass("border-success border-warning")
    $("#add-employee-form-confirm-div").addClass("d-none");
    $("#add-employee-form-error-div").removeClass("show").addClass("d-none");
    $("#add-employee-form-submit").text("Add Employee");

    $("#full-time").addClass("fw-bold").removeClass("text-muted fw-light");
    $("#part-time").addClass("fw-light text-muted").removeClass("fw-bold");
}



/****************  Employee List Display  **********************/
function refreshEmployeeTable() {
    const list = $("#employee-list");
    const loadError = $("#employee-list-load-error");
    let count = 0;
    list.empty();
    $.get("/employee", function (response, status) {
        // console.log(status);
        if (status == "success") {
            if (!response.err) {
                response.map(function (e) {
                    const availability = [];
                    e.availability.map(function (a) {
                        availability.push(a.substring(0, 2))
                    })
                    list.append('' +
                        '<tr>' +
                        '<td>' + (++count) + '</td>' +
                        '<td>' + e.fedexID + '</td>' +
                        '<td>' + e.firstName + " " + e.lastName + '</td>' +
                        '<td>' + e.assignedWA + '</td>' +
                        '<td>' + e.role + '</td>' +
                        '<td>' + (e.email ? '<a href="mailto:"' + e.email + '>' + e.email + '</a>' : "<span class='text-muted'>N/A</span>") + '</td>' +
                        '<td>' + (e.phone ? '<a href="tel:"' + e.phone + '>' + e.phone + '</a>' : "<span class='text-muted'>N/A</span>") + '</td>' +
                        '<td>' + (e.DLExp ? new Date(e.DLExp).toLocaleDateString("en-US") : "<span class='text-muted'>N/A</span>") + '</td>' +
                        '<td>' + (e.DoTExp ? new Date(e.DoTExp).toLocaleDateString("en-US") : "<span class='text-muted'>N/A</span>") + '</td>' +
                        '<td>' + (e.schedule ? e.schedule : "") + '</td>' +
                        '<td>' + availability.join() + '</td>' +
                        '</tr>' +
                        '')
                })
            } else {
                loadError.append("<div class='d-flex justify-content-center text-danger'><p class='my-3'>Failed to  retrieve employee list: " + response.err + "</p></div>");
            }
        } else {
            loadError.empty();
            loadError.append("<div class='d-flex justify-content-center text-danger'><p class='my-3'>Unable to Connect to database, please try again</p></div>");
        }
    })
}






/****************  Daily Schedule form  **********************/
async function prepareDailyScheduleForm() {
    const form = $("#daily-schedule-tbody");
    const loadError = $("#daily-schedule-form-load-error");
    floaterCount = 1;
    var count = 0;
    let allEmployees;
    let constEmployeeOptions = '<option value="0">SELECT A DRIVER</option>';
    let allWa;
    form.empty();


    function getEmployeeOptions(waName) {
        let eOptions = '<option value="0">SELECT A DRIVER</option>';
        eOptions += allEmployees.map(function (e) {
            // console.log(waName + "  :   " + e.assignedWA);
            // if (e.assignedWA != "floater") {
            //     // if (e.assignedWA != "floater" && e.assignedWA != "late pickups") {
            if (waName == (e.assignedWA)) {
                // console.log("....");
                return '<option selected="selected" value="' + e.fedexID + '">' + e.firstName + " " + e.lastName + '</option>';
            } else {
                return '<option value="' + e.fedexID + '">' + e.firstName + " " + e.lastName + '</option>';
            }
            // }
        });

        return eOptions;
    }

    function getAssignedEmployee(waName) {
        let assignedEmployee = { phone: "--" };
        allEmployees.map(function (e) {
            if (waName == e.assignedWA) {
                // console.log("....");
                assignedEmployee = e;
            }
        });

        return assignedEmployee;
    }




    await $.get("/employee", function (employees, status) {
        if (status == "success") {
            if (!employees.err) {
                allEmployees = employees;
                globalEmployees = employees;
                constEmployeeOptions += employees.map(function (e) {
                    if(e.schedule != "PTO"){
                        return '<option value="' + e.fedexID + '">' + e.firstName + " " + e.lastName + '</option>';
                    }
                });
            } else {
                console.log("connected but could not retrieve employee list");
            }
        } else {
            console.log("Unable to connect");

        }
    })

    await $.get("/wa", function (was, status) {
        if (status == "success") {
            if (was && was != false) {
                was.sort(function (a, b) {
                    if ((a.name != "late pickups" || b.name != "late pickups")) {
                        const aval = Number(a.name);
                        const bval = Number(b.name);
                        // console.log(aval+","+bval);
                        if (aval > bval) {
                            return 1;
                        } else if (aval == bval) {
                            return 0;
                        } else {
                            return -1
                        }
                    } else {
                        return 1;
                    }
                })
                allWa = was;
                globalWA = was;
                for (let i = 0; i < was.length; i++) {
                    wa = was[i];
                    let assignedEmployee = getAssignedEmployee(wa.name);
                    form.append('' +
                        '<tr>' +
                        '<td>' + (++count) + '</td>' +
                        '<td> WA ' + wa.name + '</td>' +
                        '<td> <select class="form-select" onchange="handleDriverSelect(this)" name="' + wa.name + '-driver-name" id="' + wa.name + '-driver-name">' + getEmployeeOptions(wa.name) + '</select></td>' +
                        // '<td><input type="text" class="form-control" readonly name="' + wa.name + '-fedex-id" id="' + wa.name + '-fedex-id" placeholder="000000" value = "" ></td>' +
                        '<td><select class="form-select" name="' + wa.name + '-shift" id="">' + ((wa.name == "late pickups") ? '<option value = "HD" >Half Day</option >': (""+
                        '<option value = "OFF" >OFF</option >' +
                        '<option ' + ((assignedEmployee.schedule == "fulltime") && "selected" )+' value="FD">Full Day</option>' +
                        '<option '+ ((assignedEmployee.schedule == "parttime") && "selected" )+' value="HD">Half Day</option>' +
                        '<option value="PTO">PTO</option>' ) )+
                        '</select ></td>' +
                        '<td><span id="' + wa.name + '-driver-phone"><a href="tel:' + assignedEmployee.phone + '">' + assignedEmployee.phone + '</a></span></td>' +
                        '</tr>' +
                        '')
                }
                
            } else {
                loadError.empty();
                loadError.append("<div class='d-flex justify-content-center text-danger'><p class='my-3'>Failed to  retrieve employee list: " + was + "</p></div>");
                console.log("unable to retrieve employee list");
            }
        } else {
            loadError.empty();
            loadError.append("<div class='d-flex justify-content-center text-danger'><p class='my-3'>Unable to Connect to database, please try again</p></div>");
            console.log("Unable to connect to server");
        }
    })
    // validateScheduleLoad(allEmployees, allWa);
}


function handleConfirmSave(evt) {
    const check = $(evt);
    if (check.prop("checked")) {
        $("#confirm-schedule-save").addClass("fw-bold").removeClass("text-muted fw-light");
        $("#schedule-draft-save").addClass("fw-light text-muted").removeClass("fw-bold");
    } else {
        $("#confirm-schedule-save").addClass("fw-light text-muted").removeClass("fw-bold");
        $("#schedule-draft-save").addClass("fw-bold").removeClass("text-muted fw-light");
    }
}


function validateScheduleLoad(employees, wa) {
    console.log("Called Validation after render");
}

async function handleDriverSelect(evt) {
    // console.log("Driver changed");
    var driverID = $(evt).children(":selected").attr("value");
    let selectFormID = $(evt).attr("id");
    let phoneElement = $("#"+(selectFormID.split("-")[0]) + "-driver-phone");
    // console.log(selectFormID);
    // console.log(("#" + (selectFormID.split("-")[0]) + "-driver-phone"));
    // console.log(phoneElement);
    if(driverID != "0"){
        await $.get("/employee/fedexID/" + driverID, function (driver, status) {
            if (status == "success") {
                if (!driver.err) {
                    phoneElement.html("<a href='tel:"+driver.phone+"'>"+driver.phone+"</a>")
                } else {
                    console.log(driver.err);
                }
            } else {
                console.log("Unable to Connect to server");
            }
        })
    }else{
        phoneElement.html("<a href=''> -- </a>")
    }
}



/**********   Helper Functions    ***********/

async function addDailyScheduleEntry() {
    const form = $("#daily-schedule-tbody");
    let count = floaterCount;


    function getEmployeeOptions() {
        let eOptions = '<option value="0">SELECT A DRIVER</option>';
        eOptions += globalEmployees.map(function (e) {
            // console.log(waName + "  :   " + e.assignedWA);
            // if (e.assignedWA != "floater") {
            //     // if (e.assignedWA != "floater" && e.assignedWA != "late pickups") {
            // if (waName == (e.assignedWA)) {
                // console.log("....");
                // return '<option selected="selected" value="' + e.fedexID + '">' + e.firstName + " " + e.lastName + '</option>';
            // } else {
                return '<option value="' + e.fedexID + '">' + e.firstName + " " + e.lastName + '</option>';
            // }
            // }
        });

        return eOptions;
    }

    
    form.append('' +
        '<tr>' +
        '<td>' + ("") + '</td>' +
        '<td> floater '+(count)+'</td>' +
        '<td> <select class="form-select" onchange="handleDriverSelect(this)" name="floater' + (count) + '-driver-name" id="floater' + (count) +'-driver-name">' + getEmployeeOptions() + '</select></td>' +
        '<td><select class="form-select" name="floater' + (count) +'-shift" id="">' +
        '<option value = "OFF" > OFF</option >' +
        '<option  value="FD">Full Day</option>' +
        '<option  value="HD">Half Day</option>' +
        '<option value="PTO">PTO</option>' +
        '</select ></td>' +
        '<td><span id="floater' + (count) +'-driver-phone"><a href="tel:">--</a></span></td>' +
        '</tr>' +
        '')
        floaterCount++;
}

function readyForm(formName) {
    const form = $("#" + formName);
    const formSuccess = $("#" + formName + "-success");

    if (formName == "add-employee-form") {
        console.log("refreshed employee form");
        prepareAddEmployeeForm();
    }

    if (formName == "add-vehicle-form") {
        console.log("refreshed Vehicle form");
        prepareAddVehicleForm();
    }

    form.trigger('reset');
    formSuccess.addClass("d-none");
    form.removeClass("d-none");
}

function closeAlert(evt){
    const alertDiv =  $(evt).parent();
    alertDiv.addClass("d-none").removeClass("show");
}



function setDateMin(element) {
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth() + 1; //January is 0!
    var yyyy = today.getFullYear();
    if (dd < 10) {
        dd = '0' + dd
    }
    if (mm < 10) {
        mm = '0' + mm
    }

    today = yyyy + '-' + mm + '-' + dd;
    element.attr("max", today);
}