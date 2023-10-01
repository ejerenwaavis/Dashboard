let domain = $('#domain').attr('domain');

window.onload = (event) => {
  $("#pullRequestButton").removeClass("disabled");
};


async function pullReport() {
  $("#pullRequestButton").addClass("disabled");
  $("#pullRequestButton").html('<span class="spinner-border spinner-border-sm" aria-hidden="true"></span><span role="status">Loading...</span>');
  $.get(domain + '/getReport', async function (response) {
    console.log('Processing Report');
    console.log(response);
    await displayReport(response);
  $("#pullRequestButton").removeClass("disabled");
  $("#pullRequestButton").html('Pull Request');
  
  })
}

async function displayReport(report) {
  let bigHtml="";
  for await(const driver of report[0].drivers ){
    let ofd = [];
    let del = [];
    let mls = [];
    let load = [];
    let attempts = [];  
    let html = '<tr class="table-bordered">';
    html += '<td>'+driver.driverNumber+'</td>';
    let driverName = await getDriverName(driver.driverNumber);
    console.log(driverName);
    var latestEvent = ((new Date()).setHours(0,0,0,0));
    // console.log(latestEvent);
    for await(const stop of driver.manifest){
      let info = await getTrackingnInfo(stop.barcode);
      let stopEventTime = (new Date(info[0].DateTime)).getTime()
      
      if(stopEventTime > latestEvent){
        latestEvent = stopEventTime;
      }
      switch (info[0].EventModifier) {
        case 'FOTO':
          del.push(stop);
          // console.log(stop.barcode + " : is Delivered with pix");
          break;
        case 'DLVD':
          del.push(stop);
          // console.log(stop.barcode + " : is Delivered");
          break;
        case 'UTLV':
          attempts.push(stop);
          // console.log(stop.barcode + " : is Attempted");
          break;
        case 'OFDL':
          ofd.push(stop);
          // console.log(stop.barcode + " : is Out For Delivery");
          break;
        case 'LOAD':
          load.push(stop);
          // console.log(stop.barcode + " : is Loaded");
          break;
        case 'SFCT':
          mls.push(stop);
          // console.log(stop.barcode + " : is on MLS");
          break;
        default:
          // console.log("Invalid day.");
      }
    }
    let loadNumber = ofd.length + attempts.length + del.length;
    let progress = ((del.length + attempts.length)/loadNumber) * 100;
    html += '<td>'+driverName+'</td>';
    html += '<td>'+(loadNumber)+'</td>';
    html += '<td>'+ ofd.length +'</td>';
    html += '<td>'+ del.length +'</td>';
    html += '<td>'+ (ofd.length + del.length + mls.length + attempts) +'</td>';
    html += '<td>'+ mls.length +'</td>';
    html += '<td>'+ attempts.length +'</td>';
    html += '<td> <div class="progress bg-secondary"> <div class="progress-bar bg-success" role="progressbar" style="width: '+progress+'%;"'
                  +'aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">'+progress+'%</div></div></td>';
    
    html += '<td>'+new Date(latestEvent).toLocaleString()+'</td>';
    html+="</tr>";
    bigHtml += html;
  }

  $('#reportDetails tbody').append(bigHtml);
}



/*
  Tracking event MODIFIEERS
  "DLVD" = Delivered
  "FOTO" = Picture
  "UTLV" = Attempted
  "OFDL" = Out for Delivery
  "LOAD" = Loaded
  "SFCT" = Sprting Facility
*/


/*

                <td>Avis Ezio</td>
                <td>100</td>
                <td>20</td>
                <td>79</td>
                <td>105</td>
                <td>5</td>
                <td>1</td>
                <td>
                    <div class="progress bg-secondary">
                        <div class="progress-bar bg-success" role="progressbar" style="width: 80%;" aria-valuenow="25"
                            aria-valuemin="0" aria-valuemax="100">80%</div>
                    </div>
                </td>
                <td>09/28/2023 15:05:05</td>
            </tr>
*/

function trackPackage() {
  let tracking = $("#barcodeNumber").val().trim();
  if(tracking.length > 10){
    getTrackingnInfo(tracking).then(function (details) {
      if(details != 404){
        console.log(details);
        let detailsHtml = "";
        details.forEach(detail => {  
          detailsHtml = detailsHtml + '<a class="list-group-item list-group-item-action" aria-current="true">'+
            '<div class="d-flex w-100 justify-content-between">'+
              '<h6 class="mb-1">'+ detail.EventType +'</h6>'+
              '<small>'+ new Date(detail.DateTime).toLocaleString() +'</small>'+
            '</div>';
          text = "";
          if(detail.Signature){
            text = '<p class="mb-1">'+detail.EventLongText+'. | '+ (detail.Location) +': ' + (detail.Signature)+' <span><i onclick="setTrackingImage(this)" data-bs-toggle="modal"'+
                'data-bs-target="#trackingPictureModal" imgURL="'+detail.SignatureImagePath+'" class="bi bi-camera"></i></span>.</p>';
          }else if(detail.PhotoPath){
            text = '<p class="mb-1">'+detail.EventLongText+'. | '+ (detail.Location) +' <span><i onclick="setTrackingImage(this)" data-bs-toggle="modal"'+
                'data-bs-target="#trackingPictureModal" imgURL="'+detail.PhotoPath+'" class="bi bi-camera"></i></span>.</p>';
          }else{
            text = '<p class="mb-1">'+detail.EventLongText+'.</p>';
          }
          detailsHtml = detailsHtml + text;
          
          // '<p class="mb-1">'+detail.EventLongText+'. | '+ (detail.Location?detail.Location +': ' : '') +'  '(detail.Signature? detail.Signature : '') + ' ' + (detail.SignatureImagePath+ '' : (detail.photo) )+' <span><i class="bi bi-camera"></i></span>.</p>'+
            
          detailsHtml = detailsHtml +'<small>'+detail.City +', '+detail.State+', '+detail.PostalCode+'</small>'+
          '</a>';
        });
        $("#trackingDetails").html(detailsHtml);
      }else{
        console.log("Didnt find Shit");
      }

      /** 
     
      **/
    })
  }
}

async function getDriverName(driverNumber) {
  let name = "";
  await $.get(domain + '/getDriverName/'+driverNumber, function async(result) {
    console.log(result);
    name = result.name;
  })
  return name;
}

function getTrackingnInfo(trackingNumber){
  return new Promise(function (resolve, reject){
    $.get("https://t.lasership.com/Track/"+trackingNumber+"/json", function(details,status){
      if(details){
        resolve(details.Events)
      }else{
        resolve("ERR: Cant find info")
      }
    }).catch((err) =>{
      if(err.status === 404){
        resolve(err.status); 
      }else{
        console.log("Something Happened");
      }
    })
  });
}