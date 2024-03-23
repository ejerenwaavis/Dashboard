let contractorsCache = [];
let filteredContractors = [];
let selectedContractorsForManipulation = [];

// This is a placeholder for your actual logic to fetch employee data from MongoDB
async function getContractorData() {
  // Simulating data fetching from MongoDB
  return new Promise(async resolve => {
    const contractorData = await $.get(domain + "/getContractors");
    if(contractorData.length){
      contractorsCache = contractorData;
    }
    console.log(contractorsCache);
    resolve(contractorsCache);
  });
}

// Function to render contractorsCache data in an elegant manner
function renderContractorsData(data) {
  const tbody = $('#contractors-list tbody');
  tbody.empty(); // Clear existing data
  
  data.forEach(function(contractor) {
      const row = `
          <tr>
              <td class="text-start">${contractor.driverNumber}</td>
              <td class="text-start">${contractor.namel}</td>
              <td class="text-start">${contractor.phone}</td>
              <td class="text-center">${contractor.link? '<i class="bi bi-shield-fill-check text-success fs-4"></i>' : '<i class="bi bi-shield-fill-exclamation text-danger fs-4"></i>'}</td>
              <td class="text-center">
                <div class="d-inline-block"><span class="btn pb-2 mx-1" onclick="deleteUser(this)"><i class="bi bi-person-x-fill fs-4 text-danger"></i></span></div>
              </td>
          </tr>
      `;
      tbody.append(row);
  });
}

/* ************* Contractor Manipulation &b Lnking  ************ */


async function link(evt) {
  var btn = $(evt);
  var closestTR = $(evt).closest('tr');

  var relativeCheckBox = await closestTR.find('.userCheckBox');
  console.log(relativeCheckBox);
  userID = relativeCheckBox.attr("user-id");
  console.log(userID);

  user = await usersCache.filter(u => u._id == userID);
  console.log(user);
  data = {user:user, actionMsg:"Verified", action:"verify"};

  performSingleContractorManipulationAction(data);
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



async function performSingleContractorManipulationAction(data) {
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


function resetContractorConfirmDialogBody(action){
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

  $('#contractor-info-dialog-details').html(`<p><b>The Following will be ${actionMsg}. Enter the password to continue</b> </p> <br/>`);
  
  selectedUsersForManipulation.forEach(function (u) {
    $('#contractor-info-dialog-details').append(`<p>${u.username}</p>`)
  })


  $('#contractor-info-dialog-details').append(` <div class="container"> <input type="password" placeholder="Type Admin-Verification Password" id="adminConsolePassword" value="${enteredAdminPassword}" class="form-control col-8 col-offset-2"> </div>`);
  
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
                $('#user-info-dialog-details').append(`<p class="py-3"> <span onclick="prepareContractorsInterface()" data-bs-dismiss="modal" class="btn btn-outline-accent btn-sm"> Reload Users <i class="bi bi-arrow-clockwise"></i></span> </p>`);  
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
                $('#user-info-dialog-details').append(`<p class="py-3"> <span onclick="prepareContractorsInterface()" data-bs-dismiss="modal" class="btn btn-outline-accent btn-sm"> Reload Users <i class="bi bi-arrow-clockwise"></i></span> </p>`);  
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
async function filterContractorssBy(evt){
  var action = $(evt);
  var filterBy = action.attr('data');
  
  switch (filterBy) {
    case 'showAll':
        filteredUsers = [];
          renderContractorsData(usersCache);
      break;
    case 'admin':
        filteredUsers = await usersCache.filter(u => u.isProUser);
          renderContractorsData(filteredUsers);
      break;
    case 'users':
        filteredUsers = await usersCache.filter(u => !(u.isProUser));
          renderContractorsData(filteredUsers);
      break;
    case 'verified':
        filteredUsers = await usersCache.filter(u => u.verified);
          renderContractorseData(filteredUsers);
      break;
    case 'unverified':
        filteredUsers = await usersCache.filter(u => !(u.verified));
          renderContractorsData(filteredUsers);
      break;
    default:
      console.log("Error In Filtering Users List");
      break;
  }
}


async function filterUsersNameSearch(evt){
  var searchText = $(evt).val().toLowerCase();
  console.log(`searchText is: ${searchText}`);
  var filteredContractors = [];
  filteredContractors = await contractorsCache.filter(u => (u.name.toLowerCase().includes(searchText)));
    renderContractorsData(filteredContractors);
}



async function sortContractorsBy(evt){
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
    case 'contractor-number':
        tempSortArray = tempUserCache.slice();
        await tempUserCache.reverse();
        if(arraysAreIdentical(tempUserCache,tempSortArray)){
          await tempUserCache.reverse();
          renderContractorsData(tempUserCache);
        }else{
          renderContractorsData(tempUserCache);
        }
      break;
    case 'name':
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
          renderContractorsData(tempUserCache);
        }else{
          renderContractorsData(tempUserCache);
        }
      break;
    case 'link':
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
          renderContractorsData(tempUserCache);
        }else{
          renderContractorsData(tempUserCache);
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



// Main function to prepare the employee interface

async function prepareContractorsInterface() {
  try {
    // Fetch employee data from MongoDB
    const contractorsData = await getContractorData();

    // Display the data in the interface
    renderContractorsData(contractorsData);
  } catch (error) {
    console.error('Error fetching employee data:', error);
  }
}
