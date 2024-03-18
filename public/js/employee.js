let usersCache = [];




// This is a placeholder for your actual logic to fetch employee data from MongoDB
async function getEmployeeData() {
  // Simulating data fetching from MongoDB
  return new Promise(async resolve => {
    const employeeData = await $.get(domain + "/getUsers");
    if(employeeData.length){
      usersCache = employeeData;
    }
    console.log(usersCache);
    resolve(employeeData);
  });
}

// Function to render employee data in an elegant manner
function renderEmployeeData(data) {
  const tbody = $('#users-list tbody');
  tbody.empty(); // Clear existing data
  
  data.forEach(function(employee) {
      const row = `
          <tr>
              <td class="text-start">
                  <div class="form-check">
                      <input class="form-check-input" name="userCheckBox" user-id="${employee._id}" type="checkbox" value="${employee._id}">
                  </div>
              </td>
              <td class="text-start">${employee.username}</td>
              <td class="text-start">${employee.email}</td>
              <td class="text-start">${employee.isProUser? "Admin":"User"}</td>
              <td class="text-start">${employee.verified}</td>
              <td class="text-start">
                  <div class="d-inline-block"><span class="btn pb-2 mx-1"><i class="bi bi-person-fill-down fs-4"></i></span></div>
                  <div class="d-inline-block"><span class="btn pb-2 mx-1"><i class="bi bi-person-x-fill fs-4"></i></span></div>
                  <div class="d-inline-block"><span class="btn pb-2 mx-1"><i class="bi bi-three-dots-vertical fs-4"></i></span></div>
              </td>
          </tr>
      `;
      tbody.append(row);
  });
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

  console.log("Users Found Are: ");
  console.log(selectedUsers);
  if(!selectedUsers.length){
    selectedUsers = [];
  }

  $('#user-info-dialog-details').html(`<p><b>The Following will be ${actionMsg}. Enter the password to continue</b> </p> <br/>`);
  
  
  for await(user of selectedUsers){
    $('#user-info-dialog-details').append(`<p>${user.username}</p>`)
    console.log(user.username);
  };


  $('#user-info-dialog-details').append(`<input type="text" id="adminConsolePassword" class="form-control col-8 col-offset-2">`);
  
  $("#userConfirmBtn").attr("action", ""+action);
  $("#userConfirmBtn").text(""+toSentenceCase(action)+" User(s)");

  const userInfoDialog = new bootstrap.Modal('#user-info-dialog', {
    keyboard: true
  })
  userInfoDialog.show();
  
}


async function confirmUserAction(evt) {
  let btn = $(evt);
  selectedUserIDs = await retrieveSelectedUserID();
  action = btn.attr("action");

  console.log("btn action: ", action);


  switch (action) {
    case "verify":
      console.log("calling the verify function");
      try {
        await $.post(domain + "/verifyUser", function(response) {
          console.log(response);
          if(response){

          }
        })
      } catch (error) {
        console.log('Error in verify swwitch statement');
        console.log(error);
      }
      break;
    case "deverify":
      console.log("calling the deverify Function");
      break;
    case "makeProUser":
      console.log("calling the MakeProUser");
      break;
    case "revokeProUser":
      console.log("calling revokeUserFunction");
      break;  
  case "delete":
      console.log("calling delete function");
      break;
  
    default:
      console.log("Got to the default block.");
      break;
  }
}



function makeProUser(params) {
  
}


