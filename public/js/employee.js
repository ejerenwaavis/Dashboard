let usersCache = [];
let filteredUsers = [];
let selectedUsersForManipulation = [];
let enteredAdminPassword = "";

// This is a placeholder for your actual logic to fetch employee data from MongoDB
async function getEmployeeData() {
  // Simulating data fetching from MongoDB
  return new Promise(async resolve => {
    const employeeData = await $.get(domain + "/getUsers");
    if(employeeData.length){
      usersCache = employeeData;
    }
    console.log(usersCache);
    resolve(usersCache);
  });
}

// Function to render employee data in an elegant manner
function renderEmployeeData(data) {
  const tbody = $('#users-list tbody');
  tbody.empty(); // Clear existing data
  
  data.forEach(function(employee) {
      const adminFunctions = `<div>
                                  <ul class="dropdown-menu">
                                      <li><a class="dropdown-item btn" data="date" onclick="${employee.isSuperAdmin? 'revokeProUser(this)':'makeProUser(this)'}" id="" >${employee.isSuperAdmin? 'Revoke ProUser':'Make ProUser'}</a></li>
                                  </ul>
                                  <span data-bs-toggle="dropdown" role="button" class="btn pb-2 mx-1"><i class="bi bi-three-dots-vertical fs-4"></i></span>
                              </div>`; 
      const regularFunctions = `<div class="d-inline-block"><button type="" role="button" class="btn pb-2 mx-1"><i class="bi bi-three-dots-vertical fs-4"></i></button></div>`;                         
      const row = `
          <tr>
              <td class="text-start">
                  <div class="form-check" >
                      <input onclick=handleUserSelect(this) class="form-check-input userCheckBox" name="userCheckBox" user-id="${employee._id}" type="checkbox" value="${employee._id}">
                  </div>
              </td>
              <td class="text-start">${employee.username}</td>
              <td class="text-start">${employee.email}</td>
              <td class="text-start">${employee.isProUser? "Admin":"User"}</td>
              <td class="text-center">${employee.verified? '<i class="bi bi-shield-fill-check text-success fs-4"></i>' : '<i class="bi bi-shield-fill-exclamation text-danger fs-4"></i>'}</td>
              <td class="text-center">
                <div class="d-inline-block"><span class="btn pb-2 mx-1" onclick="${employee.verified? "deverify(this)":"verify(this)"}"><i class="bi bi-person-fill-${employee.verified? "down text-warning":"up"} fs-4"></i></span></div>
              </td>
              <td class="text-center">
                <div class="d-inline-block"><span class="btn pb-2 mx-1" onclick="deleteUser(this)"><i class="bi bi-person-x-fill fs-4 text-danger"></i></span></div>
              </td>
              <td class="text-center">
                  ${clientUser?.isSuperAdmin ? adminFunctions : regularFunctions}
              </td>
          </tr>
      `;
      tbody.append(row);
  });
}


function handleUserSelect(evt) {
  var checkbox = $(evt);
  var parentTR = checkbox.closest('tr');
  parentTR.toggleClass("bg-warning bg-opacity-10");
}

function handleSelectAllUsers(evt) {
  var checkbox = $(evt);
  console.log("master checkbox is checked: ", checkbox.prop('checked'));
  if(checkbox.prop("checked")){
    $('input[name="userCheckBox"]').each(function() {
        // Add classes to the parent <tr> element
        $(this).closest('tr').addClass('bg-warning bg-opacity-10');
        $(this).closest('input[name="userCheckBox"]').prop('checked', true);
      });
    }else{
      $('input[name="userCheckBox"]').each(function() {
        // Add classes to the parent <tr> element
        $(this).closest('tr').removeClass('bg-warning bg-opacity-10');
        $(this).closest('input[name="userCheckBox"]').prop('checked', false);
    });
  }
}

// Main function to prepare the employee interface
async function prepareEmployeeInterface() {
  try {
    // Fetch employee data from MongoDB
    const employeeData = await getEmployeeData();

    // Display the data in the interface
    renderEmployeeData(employeeData);
  } catch (error) {
    console.error('Error fetching employee data:', error);
  }
}





/* ************* Employee Manipulation  ************ */


async function verify(evt) {
  var btn = $(evt);
  var closestTR = $(evt).closest('tr');

  var relativeCheckBox = await closestTR.find('.userCheckBox');
  console.log(relativeCheckBox);
  userID = relativeCheckBox.attr("user-id");
  console.log(userID);

  user = await usersCache.filter(u => u._id == userID);
  console.log(user);
  data = {user:user, actionMsg:"Verified", action:"verify"};

  performSingleUserManipulationAction(data);
}

async function deverify(evt) {
  var btn = $(evt);
  var closestTR = $(evt).closest('tr');

  var relativeCheckBox = await closestTR.find('.userCheckBox');
  console.log(relativeCheckBox);
  userID = relativeCheckBox.attr("user-id");
  console.log(userID);

  user = await usersCache.filter(u => u._id == userID);
  console.log(user);
  data = {user:user, actionMsg:"Unverified", action:"deverify"};

  performSingleUserManipulationAction(data);
}

async function deleteUser(evt) {
  var btn = $(evt);
  var closestTR = $(evt).closest('tr');

  var relativeCheckBox = await closestTR.find('.userCheckBox');
  console.log(relativeCheckBox);
  userID = relativeCheckBox.attr("user-id");
  console.log(userID);

  user = await usersCache.filter(u => u._id == userID);
  console.log(user);
  data = {user:user, actionMsg:"Deleted", action:"delete"};

  performSingleUserManipulationAction(data);
}

async function makeProUser(evt) {
  var btn = $(evt);
  var closestTR = $(evt).closest('tr');

  var relativeCheckBox = await closestTR.find('.userCheckBox');
  console.log(relativeCheckBox);
  userID = relativeCheckBox.attr("user-id");
  console.log(userID);

  user = await usersCache.filter(u => u._id == userID);
  console.log(user);
  data = {user:user, actionMsg:"Promoted to Admin", action:"makeProUser"};

  performSingleUserManipulationAction(data);
}

async function revokeProUser(evt) {
  var btn = $(evt);
  var closestTR = $(evt).closest('tr');

  var relativeCheckBox = await closestTR.find('.userCheckBox');
  console.log(relativeCheckBox);
  userID = relativeCheckBox.attr("user-id");
  console.log(userID);

  user = await usersCache.filter(u => u._id == userID);
  console.log(user);
  data = {user:user, actionMsg:"Demoted from Admin Status", action:"revokeProUser"};

  performSingleUserManipulationAction(data);
}



function retrieveSelectedUserID(){
    // Select all checkboxes with the name "fruit"
  var checkboxes = $('input[name="userCheckBox"]:checked');

  // Initialize an empty array to store the values
  var values = [];

  // Iterate over each checked checkbox and push its value to the array
  checkboxes.each(function() {
      values.push($(this).val());
  });

  // Output the values
  console.log(values);
  return values;
}



async function performBulkAction(evt) {
  selectedUserIDs = await retrieveSelectedUserID();
  btn = $(evt);
  action = btn.attr("action");
  actionMsg = btn.attr("actionMsg");
  
  let selectedUsers = await usersCache.filter(obj => selectedUserIDs.includes(obj._id));
  selectedUsersForManipulation = selectedUsers.slice();

  
  if(!selectedUsers.length){
    selectedUsers = [];
  }

  $('#user-info-dialog-tittle').text(`Bulk ${toSentenceCase(action)} Operation`);
  $('#user-info-dialog-details').html(`<p><b>The Following will be ${actionMsg}. Enter the password to continue</b> </p> <br/>`);
  

  for await(user of selectedUsers){
    $('#user-info-dialog-details').append(`<p>${user.username}</p>`)
    console.log(user.username);
  };


  $('#user-info-dialog-details').append(`<input type="password" placeholder="Type Admin-Verification Password" id="adminConsolePassword" class="form-control text-center col-6 col-offset-3">`);
  
  $("#userConfirmBtn").attr("action", ""+action);
  $("#userConfirmBtn").text(""+toSentenceCase(action)+" User(s)");

  const userInfoDialog = new bootstrap.Modal('#user-info-dialog', {
    keyboard: true
  })
  userInfoDialog.show();
  
}

async function performSingleUserManipulationAction(data) {
  let selectedUser = data.user;
  selectedUsersForManipulation = data.user

  $('#user-info-dialog-tittle').text(`Single ${toSentenceCase(data.action)} Operation`);
  $('#user-info-dialog-details').html(`<p><b>The Following will be ${data.actionMsg}. Enter the password to continue</b> </p> <br/>`);
  
  selectedUser.forEach(function (u) {
    $('#user-info-dialog-details').append(`<p>${u.username}</p>`)
  })


  $('#user-info-dialog-details').append(` <div class="container"> <input type="password" placeholder="Type Admin-Verification Password" id="adminConsolePassword" class="form-control text-center col-6 col-offset-3"> </div>`);
  $("#userConfirmBtn").attr("action", ""+data.action);
  $("#userConfirmBtn").text(""+toSentenceCase(data.action)+" User");

  const userInfoDialog = new bootstrap.Modal('#user-info-dialog', {
    keyboard: true
  })
  userInfoDialog.show();
}


function resetConfirmDialogBody(action){
  actionMsg = "";
  if(action ==="verify"){
    actionMsg = "Verified"
  }else if(action ==="deverify"){
    actionMsg = "Unverified"
  }else if(action ==="makeProUser"){
    actionMsg = "Promoted to Admin"
  }else if(action ==="revokeProUser"){
    actionMsg = "Demoted from Admin Status"
  }else if(action ==="delete"){
    actionMsg = "Deleted"
  }else{
    actionMsg = "..."
  }

  $('#user-info-dialog-details').html(`<p><b>The Following will be ${actionMsg}. Enter the password to continue</b> </p> <br/>`);
  
  selectedUsersForManipulation.forEach(function (u) {
    $('#user-info-dialog-details').append(`<p>${u.username}</p>`)
  })


  $('#user-info-dialog-details').append(` <div class="container"> <input type="password" placeholder="Type Admin-Verification Password" id="adminConsolePassword" value="${enteredAdminPassword}" class="form-control col-8 col-offset-2"> </div>`);
  
}


async function confirmUserAction(evt) {
  let btn = $(evt);
  action = btn.attr("action");
  password = $("#adminConsolePassword").val();
  
  $('#user-info-dialog-details').html(`<div class="d-flex py-3 justify-content-center">
                                       <div class="spinner-border" role="status"> <span class="visually-hidden">Loading...</span>
                                       </div> </div>`)
  console.log("Final Step is done, now sending to server");
  console.log("btn action: ", action);
  let actionMsg = "";
  if(action ==="verify"){
    actionMsg = "Verified"
  }else if(action ==="deverify"){
    actionMsg = "Unverified"
  }else if(action ==="makeProUser"){
    actionMsg = "Promoted to Admin"
  }else if(action ==="revokeProUser"){
    actionMsg = "Demoted from Admin Status"
  }else if(action ==="delete"){
    actionMsg = "Deleted"
  }else{
    actionMsg = "..."
  }

  switch (action) {
    case "verify":
      console.log("calling the verify function");
      $.post(domain+"/validateConsolePassword", {password:password} ,async function(accessGranted){
        if(accessGranted){
          try {
            await $.post(domain + "/verifyUser",{users:selectedUsersForManipulation}, function(response) {
              console.log(response);
              if(response.successfull){
                $('#user-info-dialog-details').html(`<b class="text-success">Users ${actionMsg} Successfuly</b>`);
                $('#user-info-dialog-details').append(`<p class="">Processed : ${(selectedUsersForManipulation.length - response.fails.length)} /  ${selectedUsersForManipulation.length} user(s)</p>`);
                $('#user-info-dialog-details').append(`<p class="py-3"> <span onclick="prepareEmployeeInterface()" data-bs-dismiss="modal" class="btn btn-outline-accent btn-sm"> Reload Users <i class="bi bi-arrow-clockwise"></i></span> </p>`);  
                //  $('#user-info-dialog-details').append(`<p class="py-3"> <span onlcick="resetConfirmDialogBody(${action})" class="btn btn-outline-acccent btn-sm"> Retry <i class="bi bi-arrow-clockwise"></i></span> </p>`);
              }else{
                $('#user-info-dialog-details').html(`<b class="text-success">Operation Completed with the Following Errors / Warnings</b>`);
                $('#user-info-dialog-details').append(`<p class="">Failed to process : ${response.fails.length} user(s)</p>`);
                $('#user-info-dialog-details').append(`<ul class="">`);
                for (fail of response.fails){
                  $('#user-info-dialog-details').append(`<li class=""> ${fail.username , " - " , fail.firstName} </li>`);
                }
                $('#user-info-dialog-details').append(`</ul>`);
              }
            })
          } catch (error) {
            $('#user-info-dialog-details').html(`<b class="text-danger">Operation Failed</b>`);
            $('#user-info-dialog-details').append(`<p>Error: ${error.responseText}`);
            $('#user-info-dialog-details').append(`${error.statusText}</p`);
            console.log('Error in verify swwitch statement');
            console.log(error);
          }
        }else{
          $('#user-info-dialog-details').html(`<b class="text-danger">Wrong Password</b>`);
          $('#user-info-dialog-details').append(`<p class="py-3"> <span onclick="resetConfirmDialogBody('${action}')" class="btn btn-outline-accent btn-sm"> Retry <i class="bi bi-arrow-clockwise"></i></span> </p>`);
          
          console.log('Invalid Admin Password');
        }
      });
      break;
    case "deverify":
      console.log("calling the deverify function");
      $.post(domain+"/validateConsolePassword", {password:password} ,async function(accessGranted){
        if(accessGranted){
          try {
            await $.post(domain + "/restrictUser",{users:selectedUsersForManipulation}, function(response) {
              console.log(response);
              if(response.successfull){
                $('#user-info-dialog-details').html(`<b class="text-success">Operation Completed</b>`);
                $('#user-info-dialog-details').append(`<p class="">Processed : ${(selectedUsersForManipulation.length - response.fails.length)} /  ${selectedUsersForManipulation.length} user(s)</p>`);
                $('#user-info-dialog-details').append(`<p class="py-3"> <span onclick="prepareEmployeeInterface()" data-bs-dismiss="modal" class="btn btn-outline-accent btn-sm"> Reload Users <i class="bi bi-arrow-clockwise"></i></span> </p>`);  
            //  $('#user-info-dialog-details').append(`<p class="py-3"> <span onlcick="resetConfirmDialogBody(${action})" class="btn btn-outline-acccent btn-sm"> Retry <i class="bi bi-arrow-clockwise"></i></span> </p>`);
              }else{
                $('#user-info-dialog-details').html(`<b class="text-success">Operation Completed with the Following Errors / Warnings</b>`);
                $('#user-info-dialog-details').append(`<p class="">Failed to process : ${response.fails.length} user(s)</p>`);
                $('#user-info-dialog-details').append(`<ul class="">`);
                for (fail of response.fails){
                  $('#user-info-dialog-details').append(`<li class=""> ${fail.username , " - " , fail.firstName} </li>`);
                }
                $('#user-info-dialog-details').append(`</ul>`);
              }
            })
          } catch (error) {
            $('#user-info-dialog-details').html(`<b class="text-danger">Operation Failed</b>`);
            $('#user-info-dialog-details').append(`<p>Error: ${error.responseText}`);
            $('#user-info-dialog-details').append(`${error.statusText}</p`);
            console.log('Error in verify swwitch statement');
            console.log(error);
          }
        }else{
          $('#user-info-dialog-details').html(`<b class="text-danger">Wrong Password</b>`);
          $('#user-info-dialog-details').append(`<p class="py-3"> <span onclick="resetConfirmDialogBody('${action}')" class="btn btn-outline-accent btn-sm"> Retry <i class="bi bi-arrow-clockwise"></i></span> </p>`);
          
          console.log('Invalid Admin Password');
        }
      });
      break;
    case "makeProUser":
      console.log("calling the makeProUser function");
      $.post(domain+"/validateConsolePassword", {password:password} ,async function(accessGranted){
        if(accessGranted){
          try {
            await $.post(domain + "/makeProUser",{users:selectedUsersForManipulation}, function(response) {
              console.log(response);
              if(response.successfull){
                $('#user-info-dialog-details').html(`<b class="text-success">Operation Completed</b>`);
                $('#user-info-dialog-details').append(`<p class="">Processed : ${(selectedUsersForManipulation.length - response.fails.length)} /  ${selectedUsersForManipulation.length} user(s)</p>`);
                $('#user-info-dialog-details').append(`<p class="py-3"> <span onclick="prepareEmployeeInterface()" data-bs-dismiss="modal" class="btn btn-outline-accent btn-sm"> Reload Users <i class="bi bi-arrow-clockwise"></i></span> </p>`);  
            //  $('#user-info-dialog-details').append(`<p class="py-3"> <span onlcick="resetConfirmDialogBody(${action})" class="btn btn-outline-acccent btn-sm"> Retry <i class="bi bi-arrow-clockwise"></i></span> </p>`);
              }else{
                $('#user-info-dialog-details').html(`<b class="text-success">Operation Completed with the Following Errors / Warnings</b>`);
                $('#user-info-dialog-details').append(`<p class="">Failed to process : ${response.fails.length} user(s)</p>`);
                $('#user-info-dialog-details').append(`<ul class="">`);
                for (fail of response.fails){
                  $('#user-info-dialog-details').append(`<li class=""> ${fail.username , " - " , fail.firstName} </li>`);
                }
                $('#user-info-dialog-details').append(`</ul>`);
              }
            })
          } catch (error) {
            $('#user-info-dialog-details').html(`<b class="text-danger">Operation Failed</b>`);
            $('#user-info-dialog-details').append(`<p>Error: ${error.responseText}`);
            $('#user-info-dialog-details').append(`${error.statusText}</p`);
            console.log('Error in verify swwitch statement');
            console.log(error);
          }
        }else{
          $('#user-info-dialog-details').html(`<b class="text-danger">Wrong Password</b>`);
          $('#user-info-dialog-details').append(`<p class="py-3"> <span onclick="resetConfirmDialogBody('${action}')" class="btn btn-outline-accent btn-sm"> Retry <i class="bi bi-arrow-clockwise"></i></span> </p>`);
          
          console.log('Invalid Admin Password');
        }
      });
      break;
    case "revokeProUser":
      console.log("calling revokeUserFunction");
      $.post(domain+"/validateConsolePassword", {password:password} ,async function(accessGranted){
        if(accessGranted){
          try {
            await $.post(domain + "/revokeProUser",{users:selectedUsersForManipulation}, function(response) {
              console.log(response);
              if(response.successfull){
                $('#user-info-dialog-details').html(`<b class="text-success">Operation Completed</b>`);
                $('#user-info-dialog-details').append(`<p class="">Processed : ${(selectedUsersForManipulation.length - response.fails.length)} /  ${selectedUsersForManipulation.length} user(s)</p>`);
                $('#user-info-dialog-details').append(`<p class="py-3"> <span onclick="prepareEmployeeInterface()" data-bs-dismiss="modal" class="btn btn-outline-accent btn-sm"> Reload Users <i class="bi bi-arrow-clockwise"></i></span> </p>`);  
            //  $('#user-info-dialog-details').append(`<p class="py-3"> <span onlcick="resetConfirmDialogBody(${action})" class="btn btn-outline-acccent btn-sm"> Retry <i class="bi bi-arrow-clockwise"></i></span> </p>`);
              }else{
                $('#user-info-dialog-details').html(`<b class="text-success">Operation Completed with the Following Errors / Warnings</b>`);
                $('#user-info-dialog-details').append(`<p class="">Failed to process : ${response.fails.length} user(s)</p>`);
                $('#user-info-dialog-details').append(`<ul class="">`);
                for (fail of response.fails){
                  $('#user-info-dialog-details').append(`<li class=""> ${fail.username , " - " , fail.firstName} </li>`);
                }
                $('#user-info-dialog-details').append(`</ul>`);
              }
            })
          } catch (error) {
            $('#user-info-dialog-details').html(`<b class="text-danger">Operation Failed</b>`);
            $('#user-info-dialog-details').append(`<p>Error: ${error.responseText}`);
            $('#user-info-dialog-details').append(`${error.statusText}</p`);
            console.log('Error in verify swwitch statement');
            console.log(error);
          }
        }else{
          $('#user-info-dialog-details').html(`<b class="text-danger">Wrong Password</b>`);
          $('#user-info-dialog-details').append(`<p class="py-3"> <span onclick="resetConfirmDialogBody('${action}')" class="btn btn-outline-accent btn-sm"> Retry <i class="bi bi-arrow-clockwise"></i></span> </p>`);
          
          console.log('Invalid Admin Password');
        }
      });
      break;  
  case "delete":
      console.log("calling delete function");
      $.post(domain+"/validateConsolePassword", {password:password} ,async function(accessGranted){
        if(accessGranted){
          try {
            await $.post(domain + "/deleteUser",{users:selectedUsersForManipulation}, function(response) {
              console.log(response);
              if(response.successfull){
                $('#user-info-dialog-details').html(`<b class="text-success">Operation Completed</b>`);
                $('#user-info-dialog-details').append(`<p class="">Processed : ${(selectedUsersForManipulation.length - response.fails.length)} /  ${selectedUsersForManipulation.length} user(s)</p>`);
                $('#user-info-dialog-details').append(`<p class="py-3"> <span onclick="prepareEmployeeInterface()" data-bs-dismiss="modal" class="btn btn-outline-accent btn-sm"> Reload Users <i class="bi bi-arrow-clockwise"></i></span> </p>`);  
            //  $('#user-info-dialog-details').append(`<p class="py-3"> <span onlcick="resetConfirmDialogBody(${action})" class="btn btn-outline-acccent btn-sm"> Retry <i class="bi bi-arrow-clockwise"></i></span> </p>`);
              }else{
                $('#user-info-dialog-details').html(`<b class="text-success">Operation Completed with the Following Errors / Warnings</b>`);
                $('#user-info-dialog-details').append(`<p class="">Failed to process : ${response.fails.length} user(s)</p>`);
                $('#user-info-dialog-details').append(`<ul class="">`);
                for (fail of response.fails){
                  $('#user-info-dialog-details').append(`<li class=""> ${fail.username , " - " , fail.firstName} </li>`);
                }
                $('#user-info-dialog-details').append(`</ul>`);
              }
            })
          } catch (error) {
            $('#user-info-dialog-details').html(`<b class="text-danger">Operation Failed</b>`);
            $('#user-info-dialog-details').append(`<p>Error: ${error.responseText}`);
            $('#user-info-dialog-details').append(`${error.statusText}</p`);
            console.log('Error in verify swwitch statement');
            console.log(error);
          }
        }else{
          $('#user-info-dialog-details').html(`<b class="text-danger">Wrong Password</b>`);
          $('#user-info-dialog-details').append(`<p class="py-3"> <span onclick="resetConfirmDialogBody('${action}')" class="btn btn-outline-accent btn-sm"> Retry <i class="bi bi-arrow-clockwise"></i></span> </p>`);
          
          console.log('Invalid Admin Password');
        }
      });
      break;
  
    default:
      console.log("Got to the default block.");
      break;
  }
}







/********* SORT AND FILTERATION **********/
async function filterUsersBy(evt){
  var action = $(evt);
  var filterBy = action.attr('data');
  
  switch (filterBy) {
    case 'showAll':
        filteredUsers = [];
          renderEmployeeData(usersCache);
      break;
    case 'admin':
        filteredUsers = await usersCache.filter(u => u.isProUser);
          renderEmployeeData(filteredUsers);
      break;
    case 'users':
        filteredUsers = await usersCache.filter(u => !(u.isProUser));
          renderEmployeeData(filteredUsers);
      break;
    case 'verified':
        filteredUsers = await usersCache.filter(u => u.verified);
          renderEmployeeData(filteredUsers);
      break;
    case 'unverified':
        filteredUsers = await usersCache.filter(u => !(u.verified));
          renderEmployeeData(filteredUsers);
      break;
    default:
      console.log("Error In Filtering Users List");
      break;
  }
}


async function filterUsersNameSearch(evt){
  var searchText = $(evt).val().toLowerCase();
  console.log(`searchText is: ${searchText}`);
  var filteredUsers = [];
  filteredUsers = await usersCache.filter(u => (u.username.toLowerCase().includes(searchText)));
    renderEmployeeData(filteredUsers);
}



async function sortUsersBy(evt){
  var tempSortArray = [];
  var action = $(evt);
  var sortBy = action.attr('data');
  
  var tempUserCache = usersCache;

  if(filteredUsers.length > 0){
    tempUserCache  = filteredUsers.slice();
    // console.log("reassigned tempUsersCache to: ");
    // console.log(tempUserCache);
  }

  switch (sortBy) {
    case 'date':
        tempSortArray = tempUserCache.slice();
        await tempUserCache.reverse();
        if(arraysAreIdentical(tempUserCache,tempSortArray)){
          await tempUserCache.reverse();
          renderEmployeeData(tempUserCache);
        }else{
          renderEmployeeData(tempUserCache);
        }
      break;
    case 'role':
        tempSortArray = tempUserCache.slice();
        await tempUserCache.sort(function (a,b){
          if (a.isProUser > b.isProUser) {
              return 1;   
          }else if (a.isProUser < b.isProUser){
              return -1;
          }else{
              return 0;
          }
        });   
        if(arraysAreIdentical(tempUserCache,tempSortArray)){
          await tempUserCache.reverse();
          renderEmployeeData(tempUserCache);
        }else{
          renderEmployeeData(tempUserCache);
        }
      break;
    case 'verified':
        tempSortArray = tempUserCache.slice();
        await tempUserCache.sort(function (a,b){
          var aValue = a.verified ? 1 : 0;
          var bValue = b.verified ? 1 : 0;
          if ( aValue > bValue) {
              return 1;   
          }else if (aValue < bValue){
              return -1;
          }else{
              return 0;
          }
        });
        if(arraysAreIdentical(tempUserCache,tempSortArray)){
          await tempUserCache.reverse();
          renderEmployeeData(tempUserCache);
        }else{
          renderEmployeeData(tempUserCache);
        }
      break;
    case 'name':
        tempSortArray = tempUserCache.slice();
        await tempUserCache.sort(function (a,b){
          if (a.username[0] > b.username[0]) {
              return 1;   
          }else if (a.username[0] < b.username[0]){
              return -1;
          }else{
            if (a.username[1] > b.username[1]) {
                return 1;   
            }else if (a.username[1] < b.username[1]){
                return -1;
            }else{
              return 0;
            }
          }
        });
       
        if(arraysAreIdentical(tempUserCache,tempSortArray)){
          await tempUserCache.reverse();
          renderEmployeeData(tempUserCache);
        }else{
          renderEmployeeData(tempUserCache);
        }
      break;
  
    default:
      console.log("Error In Sorting Users List");
      break;
  }
}



/************** HELPER FUNCTIONS ************ */


// Function to compare arrays of objects
function arraysAreIdentical(arr1, arr2) {
    if (arr1.length !== arr2.length) {
        return false;
    }
    
    for (var i = 0; i < arr1.length; i++) {
        var obj1 = arr1[i];
        var obj2 = arr2[i];
        
        // Compare object properties
        for (var prop in obj1) {
            if (obj1[prop] !== obj2[prop]) {
                return false;
            }
        }
    }
    
    return true;
}