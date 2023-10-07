let domain = $('#domain').attr('domain');
let trackingResource = "";
let priorityBrands = null;
let drivers = [];
let clientDeiverStatus = [];
let totalStops = 0;
let stopCount = 0;
let eventCodes = [];
let stopReportPull = false;
eventCodes.problemStops = [];


window.onload = async (event) => {
  trackingResource = await getTrackingURL();
  priorityBrands = await getPriorityBrands();
  let update = await pullLocalReport();
};


async function pullReport() {
  stopReportPull = false;
  $("#pullRequestButton").addClass("disabled");
  $("#pullRequestButton").html('<span class="spinner-border spinner-border-sm" aria-hidden="true"></span><span id="" role="status"> <span id="report-process-status" role="status">Loading...</span></span>');
  // let manifestProcessing = await processManifests();
  // console.log(manifestProcessing);
  $.get(domain + '/getReport', async function (response) {
    if(response.length > 0){
      console.log('Processing Report');
      console.log(response);
      let updatedDrivers = await displayReport(response);
      drivers = updatedDrivers;
      updateLoadStatus("Saving Updates...")
      let result = await saveDriverStatus(response[0]._id, updatedDrivers);
      if(result.successfull){
        $('#lastUpdated').text(' Last Updated: ' + new Date(result.updatedDoc.lastUpdated).toLocaleString());
        // console.log(result);
        console.log('Saved Online Copy Successsfully');
      }else{
        console.error('Failed to save Online version');
      }
      $("#pullRequestButton").removeClass("disabled");
      $("#pullRequestButton").html('Pull Report');
      $('#sync-warning').addClass("d-none");
    }else{
      console.log("No Driver Manifests Report Found at the Moment");
      $('#sync-warning').text("Hmm.... it looks No Driver Manifests has been submitted to designated email.");
      $('#sync-warning').removeClass("d-none");
        $("#pullRequestButton").removeClass("disabled");
      $("#pullRequestButton").html('Pull Report');
    }
  })
}

async function pullLocalReport() {
  stopReportPull = false;
  $("#pullRequestButton").addClass("disabled");
  $("#pullRequestButton").html('<span class="spinner-border spinner-border-sm" aria-hidden="true"></span><span id="" role="status"> <span id="report-process-status" role="status">Loading...</span></span>');
  // let manifestProcessing = await processManifests();
  // console.log(manifestProcessing);
  let updatdReport = null;
  await $.get(domain + '/getReport', async function (response) {
    if(response.length > 0){
      console.log('Processing Local Report');
      console.log(response);
      if(response[0].lastUpdated != null){
        totalStops = response[0].drivers.reduce((accumulator, driver) => {
                        return accumulator + driver.manifest.length;
                      }, 0);
        // console.log("total Stop Count is: "+ totalStops);
        updatdReport = await displayReport(response);
        drivers = updatdReport;
        // console.log(updatdReport);
        if(updatdReport.lastUpdated){
          $('#lastUpdated').text(' Last Updated: ' + new Date(updatdReport.lastUpdated).toLocaleString());
        }else{
          $('#lastUpdated').text(' Showing Local Report');
        }
      }else{
        $('#sync-warning').removeClass("d-none");
      }
      $("#pullRequestButton").removeClass("disabled");
      $("#pullRequestButton").html('Pull Report');
      console.log("Manifest not in Sync With Ontrac Server");

    }else{
      console.log("No Driver Manifests Report Found at the Moment");
      $('#sync-warning').text("Hmm.... it looks No Driver Manifests has been submitted to designated email.");
      $('#sync-warning').removeClass("d-none");
        $("#pullRequestButton").removeClass("disabled");
      $("#pullRequestButton").html('Pull Report');
    }
  });
  return updatdReport;
}

async function displayReport(report) {
  $('#reportDetails tbody').html("")
  $('#driverPlaceHolder').removeClass('d-none');
  let bigHtml="";
  let driverStatus = [];
  let driverCount = 0;
  let drivers = report[0].drivers;
  let totalOnlinePulls = 0;
  stopCount = 0;
  mslEvents = ['ONHD','HW','DWDD','EMAR','RB','LOAD','SFCT','Returned','CR'];


  drivers.lastUpdated = report[0].lastUpdated;

  for await(const driver of drivers ){
    if(stopReportPull){
      console.log("broke outta drivers loop");
        break;
    }
    driverCount++;
    let ofd = [];
    let pofd = [];
    let del = [];
    let mls = [];
    let load = [];
    let attempts = [];
    let problemStops = [];
    let html = '<tr class="table-bordered">';
    html += '<td>'+driver.driverNumber+'</td>';
    let driverName = await getDriverName(driver.driverNumber);
    console.log("Working on _ "+ driverName);
    driver.driverName = driverName;
    var latestEvent = ((new Date()).setHours(0,0,0,0));
    // console.log(latestEvent);
    let count = 0;
    for await(const stop of driver.manifest){
      stopCount ++;
    updateLoadStatus((Math.trunc(((stopCount/totalStops) * 100))) + "% Loading...");
      if(stopReportPull){
        console.log("broke outta stop loop");
        break;
      }
      // console.log((count++)+'/'+driver.manifest.length);
      if(!stop.Events){
        console.log("no local events found, puling from external source");
        let info = await getTrackingnInfo(stop.barcode);
        stop.Events = info;
        totalOnlinePulls++;
      }else if(stop.Events[0].EventCode === 'DLVD' || stop.Events[0].Status === 'Delivered' || stop.Events[0].EventShortDescription === 'Delivered.'){
        // console.log("Already Delivered. not puling from external source");
      }else{
        let info = await getTrackingnInfo(stop.barcode);
        stop.Events = info;
        totalOnlinePulls++;
        // console.log(stop);
      }

      // console.log(stop.Events);
      let stopEventTime = (new Date(stop.Events[0].UtcEventDateTime)).getTime()
      
      if(stopEventTime > latestEvent){
        latestEvent = stopEventTime;
      }
      if(stop.Events[0].EventCode === 'DLVD' || stop.Events[0].Status === 'Delivered' || stop.Events[0].EventShortDescription === 'Delivered.'){
          del.push(stop);
      }else if(stop.Events[0].EventCode === 'OFDL' || stop.Events[0].EventCode === 'OD' || stop.Events[0].EventShortDescription === 'Out for delivery.'){
          const containsPriority = priorityBrands.some(p => (p.name).toLowerCase() == (stop.brand).toLowerCase());
          if(containsPriority){
            pofd.push(stop);
          }else{
            ofd.push(stop);
          }
      }else if(stop.Events[0].EventCode === 'NH' || stop.Events[0].EventCode === 'UTLV' || stop.Events[0].EventCode === 'NDMI' || stop.Events[0].EventCode === 'BCLD' 
              || ((stop.Events[0].Status === 'Pending' 
              || stop.Events[0].EventShortDescription === 'Delayed. Delivery date updated.' ) && (! mslEvents.includes(stop.Events[0].EventCode)))){
          attempts.push(stop);
      }else if(stop.Events[0].EventCode === 'RD' 
              || stop.Events[0].EventCode === 'UD' 
              || stop.Events[0].EventCode === 'ONHD' 
              || stop.Events[0].EventCode === 'HW'
              || stop.Events[0].EventCode === 'DWDD'
              || stop.Events[0].EventCode === 'EMAR' 
              || stop.Events[0].EventCode === 'RB' 
              || stop.Events[0].EventCode === 'SFCT' 
              || stop.Events[0].EventCode === 'LOAD'
              || stop.Events[0].EventCode === 'CR'
              || stop.Events[0].Status === 'Returned'
              || stop.Events[0].EventShortDescription === 'Packaged received at the facility.' 
              || stop.Events[0].EventShortDescription === 'Returned. Contact sender.'
              || stop.Events[0].EventShortDescription === 'Damaged. Contact sender.'){
          mls.push(stop);
      }else{
        console.log("Cant Process Package: "+ stop.barcode);
        problemStops.push(stop);
      }
      code = {EventCode:stop.Events[0].EventCode, EventShortDescription:stop.Events[0].EventShortDescription};
      
      eventCodes.some(c => c.EventCode == code.EventCode)? null : eventCodes.push(code);
    }
    let loadNumber = ofd.length + attempts.length + del.length;
    let progress = Math.trunc(((del.length + attempts.length)/loadNumber) * 100);
    html += '<td>'+driverName+'</td>';
    html += '<td> <a class="btn p-0 m-0" driverNumber="'+driver.driverNumber+'" stopType="load" onclick="showDetailedStops(this)">'+(loadNumber)+'</a></td>';
    html += '<td> <a class="btn p-0 m-0" driverNumber="'+driver.driverNumber+'" stopType="ofd" onclick="showDetailedStops(this)">'+ ofd.length +'</a></td>';
    html += '<td> <a class="btn p-0 m-0" driverNumber="'+driver.driverNumber+'" stopType="pofd" onclick="showDetailedStops(this)">'+ pofd.length +'</a></td>';
    html += '<td> <a class="btn p-0 m-0" driverNumber="'+driver.driverNumber+'" stopType="del" onclick="showDetailedStops(this)">'+ del.length +'</a></td>';
    html += '<td> <a class="btn p-0 m-0" driverNumber="'+driver.driverNumber+'" stopType="mls" onclick="showDetailedStops(this)">'+ mls.length +'</a></td>';
    html += '<td> <a class="btn p-0 m-0" driverNumber="'+driver.driverNumber+'" stopType="attempts" onclick="showDetailedStops(this)">'+ attempts.length +'</a></td>';
    html += '<td> <div class="progress bg-secondary"> <div class="progress-bar bg-success" role="progressbar" style="width: '+progress+'%;"'
                  +'aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">'+progress+'%</div></div></td>';
    html += '<td>'+new Date(latestEvent).toLocaleString()+'</td>';
    html+="</tr>";
    let quickHtml = html;
    bigHtml += html;
    if(driverCount >= drivers.length){
      $('#driverPlaceHolder').addClass('d-none');
    }
    $('#reportDetails tbody').append(quickHtml);
    html="";
    driverStatus.push({name:driverName, driverNumber:driver.driverNumber, updatedManifest:{mls:mls,ofd:ofd,del:del,attempts:attempts, problemStops:problemStops}});
    clientDeiverStatus.push({name:driverName, driverNumber:driver.driverNumber, updatedManifest:{mls:mls,ofd:ofd, pofd:pofd,del:del,attempts:attempts, problemStops:problemStops}})
  }
  // clientDeiverStatus = driverStatus;
  console.log("Total Pulls: "+totalOnlinePulls);
  if(eventCodes.problemStops.length > 0){
    console.log(eventCodes);
  }
  return drivers;
}

async function showDetailedStops(evt){
  $('#detailModalTable tbody').html("");
  stopType = $(evt).attr("stopType");
  driverNumber = Number($(evt).attr("driverNumber"));
  
  // console.log(drivers);
  driver = await clientDeiverStatus.find((d) => d.driverNumber === driverNumber);
  driverName = driver.name;
  // console.log(driver);
  stopArray = [];
  // console.log(stopArray);
  if(stopType == "mls"){
    stopArray = driver.updatedManifest.mls;
  }else if (stopType == "ofd"){
    stopArray = driver.updatedManifest.ofd;
  }else if (stopType == "pofd"){
    stopArray = driver.updatedManifest.pofd;
  }else if (stopType == "load"){
    stopArray = [...driver.updatedManifest.ofd,...driver.updatedManifest.del,...driver.updatedManifest.attempts];
  }else if (stopType == "del"){
    stopArray = driver.updatedManifest.del;
  }else if (stopType == "attempts"){
    stopArray = driver.updatedManifest.attempts;
  }else if (stopType == "problemStops"){
    stopArray = driver.updatedManifest.problemStops;
  }
  
  for await (const stop of stopArray){
    let html = '<tr class="table-bordered">';
    html += '<td> '+(stop.barcode)+'</td>';
    html += '<td> '+ stop.brand +'</td>';
    html += '<td> '+ stop.name +'</td>';
    html += '<td>'+ stop.street +'</td>';
    html += '<td> '+ stop.city +'</td>';
    html += '<td> '+ stop.state +'</td>';
    html += '<td> '+ stop.Events[0].Status + '</td>';
    html += '<td>'+new Date(stop.Events[0].UtcEventDateTime).toLocaleString()+'</td>';
    html+="</tr>";
    $('#detailModalTable tbody').append(html);
  }

  $("#detailsHeader").text(stopType.toUpperCase()+": "+driverName);
  
  const stopsDetailed = new bootstrap.Modal('#detailModal', {
    keyboard: true
  })
  stopsDetailed.show();
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
      // console.log('Tracking URL Acquired');
    }).fail(function(error) {
      reject(error);
    });
  });
}

function getPriorityBrands() {
  return new Promise((resolve, reject) => {
    $.get(domain + '/getPriorityBrands', function(data) {
      resolve(data);
      // console.log('Tracking URL Acquired');
    }).fail(function(error) {
      reject(error);
    });
  });
}


function saveDriverStatus(reportID, updatedDrivers) {
  return new Promise((resolve, reject) => {
    let url = domain + '/saveDriverStatus';
    $.post(url, {reportID:reportID, updatedDrivers:updatedDrivers}, function(result) {
      if(result){
        resolve(result);
      }else{
        reject(result);
      }
    }).fail(function(error) {
      reject(error);
    });
  });
}
 function stopOullingProcess() {
  stopReportPull = true;
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

function updateLoadStatus(status) {
  $("#report-process-status").text(''+ status + '');
}


function getTrackingnInfo(trackingNumber){
  return new Promise(async function (resolve, reject){
    $.get(trackingResource+trackingNumber, function(details,status){
      // console.log(details);
      // console.log(status);
      if(details){
        let Events = details.Packages[0].Events;
        if(details.Packages[0].VpodImageString){
          // console.log("stop Has a VPOD");
          Events.vpod = "data:image/"+details.Packages[0].VpodImageFormat+";base64,"+details.Packages[0].VpodImageString; 
        }
        resolve(Events)
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

