let domain = $('#domain').attr('domain');
let trackingResource = "";
window.onload = async (event) => {
  $("#pullRequestButton").removeClass("disabled");
    trackingResource = await getTrackingURL();
};


async function pullReport() {
  $("#pullRequestButton").addClass("disabled");
  $("#pullRequestButton").html('<span class="spinner-border spinner-border-sm" aria-hidden="true"></span><span id="report-process-status" role="status"> Loading...</span>');
  // let manifestProcessing = await processManifests();
  // console.log(manifestProcessing);
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
    let count = 0;
    for await(const stop of driver.manifest){
      console.log((count++)+'/'+driver.manifest.length);
      let info = await getTrackingnInfo(stop.barcode);
      // console.log(info);
      let stopEventTime = (new Date(info[0].UtcEventDateTime)).getTime()
      
      if(stopEventTime > latestEvent){
        latestEvent = stopEventTime;
      }
      if(info[0].EventCode === 'DLVD' || info[0].Status === 'Delivered'){
          del.push(stop);
      }else if(info[0].EventCode === 'OFDL' || info[0].EventCode === 'OD' || info[0].EventShortDescription === 'Out for delivery.'){
          ofd.push(stop);
          // console.log(info[0]);
          // console.log(stop.street);
      }else if(info[0].EventCode === 'NH' || info[0].EventCode === 'BCLD' || info[0].EventShortDescription === 'Delayed. Delivery date updated.' || info[0].Status === 'Pending'){
          attempts.push(stop);
      }else if(info[0].EventCode === 'RD' || info[0].EventCode === 'SFCT' || info[0].EventShortDescription === 'Packaged received at the facility.'){
          mls.push(stop);
      }else{
        console.log("Cant Process Package: "+ stop.barcode);
      }
    }
    let loadNumber = ofd.length + attempts.length + del.length;
    let progress = Math.trunc(((del.length + attempts.length)/loadNumber) * 100);
    html += '<td>'+driverName+'</td>';
    html += '<td>'+(loadNumber)+'</td>';
    html += '<td>'+ ofd.length +'</td>';
    html += '<td>'+ del.length +'</td>';
    html += '<td>'+ (ofd.length + del.length + mls.length + attempts.length) +'</td>';
    html += '<td>'+ mls.length +'</td>';
    html += '<td>'+ attempts.length +'</td>';
    html += '<td> <div class="progress bg-secondary"> <div class="progress-bar bg-success" role="progressbar" style="width: '+progress+'%;"'
                  +'aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">'+progress+'%</div></div></td>';
    html += '<td>'+new Date(latestEvent).toLocaleString()+'</td>';
    html+="</tr>";
    bigHtml += html;
  }
  $('#reportDetails tbody').html("")
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

// async function getDriverName(driverNumber) {
//   let name = "";
//   await $.get(domain + '/getDriverName/'+driverNumber, function async(result) {
//     console.log(result);
//     name = result.name;
//   })
//   return name;
// }

function getDriverName(driverNumber) {
  return new Promise((resolve, reject) => {
    let name = "";
    $.get(domain + '/getDriverName/'+driverNumber, function(data) {
      // console.log(data.name);
      resolve(data.name);
    }).fail(function(error) {
      reject(error);
    });
  });
}

function getTrackingURL() {
  return new Promise((resolve, reject) => {
    $.get(domain + '/getTrackingResource', function(data) {
      resolve(data);
      console.log('Tracking URL Acquired');
    }).fail(function(error) {
      reject(error);
    });
  });
}
function processManifests() {
  return new Promise((resolve, reject) => {
    let url = 'https://triumphcourier.com/mailreader/extract';
    $.get(url, function(data) {
      // console.log(data);
      resolve(data);
    }).fail(function(error) {
      reject(error);
    });
  });
}


function getTrackingnInfo(trackingNumber){
  return new Promise(async function (resolve, reject){
    $.get(trackingResource+trackingNumber, function(details,status){
      // console.log(details);
      // console.log(status);
      if(details){
        resolve(details.Packages[0].Events)
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