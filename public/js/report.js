let domain = $('#domain').attr('domain');
let trackingResource = "";
let trackingResource2 = "";
let priorityBrands = null;
let drivers = [];
let clientDeiverStatus = [];
let totalStops = 0;
let stopCount = 0;
let totalOnlinePulls = 0;
let eventCodes = [];
let stopReportPull = false;
let pullFromServer = false;
eventCodes.problemStops = [];
let onloadReport = null;

window.onload = async (event) => {
  $("#deliveryReport-nav-button").click(); //simulates the show action for the nav tabls
  trackingResource = await getTrackingURL();
  trackingResource2 = await getTrackingURL2();
  priorityBrands = await getPriorityBrands();
  update = await pullLocalReport();
};



async function pullReport() {
  stopReportPull = false;
  pullFromServer = true;
  $("#pullRequestButton").addClass("disabled");
  $("#pullRequestButton").html('<span class="spinner-border spinner-border-sm" aria-hidden="true"></span><span id="" role="status"> <span id="report-process-status" role="status">Loading...</span></span>');
  // let manifestProcessing = await processManifests();
  // console.log(manifestProcessing);
  $.get(domain + '/getDriverReport', async function (drivers) {
    if(drivers.length > 0){
      console.log('Processing Report');
      console.log(drivers);
      totalStops = await drivers.reduce((accumulator, driver) => {
                        return accumulator + driver.manifest.length;
                      }, 0);
      let result = await displayReport(drivers);
      drivers = result.drivers;
      updateLoadStatus("Finalizing Updates...")
      // let result = await saveDriverStatus(response[0]._id, updatedDrivers);
      if(result.lastUpdated){
        $('#lastUpdated').text(' Last Updated: ' + result.lastUpdated);
      //   // console.log(result);
      //   pullFromServer = false;
      //   console.log('Saved Online Copy Successsfully');
      }else{
        pullFromServer = false;
      //   console.error('Failed to save Online version');
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

async function pullPastReport(dateTime) {
  stopReportPull = false;
  pullFromServer = true;
  $("#pullRequestButton").addClass("disabled");
  $("#pullRequestButton").html('<span class="spinner-border spinner-border-sm" aria-hidden="true"></span><span id="" role="status"> <span id="report-process-status" role="status">Loading...</span></span>');
  // let manifestProcessing = await processManifests();
  // console.log(manifestProcessing);
  $.get(domain + '/getReport/'+dateTime, async function (response) {
    if(response.length > 0){
      console.log('Processing Past Report');
      console.log(response);
      totalStops = await response[0].drivers.reduce((accumulator, driver) => {
                        return accumulator + driver.manifest.length;
                      }, 0);
      let updatedDrivers = await displayReport(response[0].drivers, {dateTime:dateTime});
      drivers = updatedDrivers;
      updateLoadStatus("Saving Updates...")
      let result = {successfull: false, msg:"No need to save on an old report for accuracy reasons"}//await saveDriverStatus(response[0]._id, updatedDrivers);
      if(result.successfull){
        $('#lastUpdated').text(' Last Updated: ' + new Date(result.updatedDoc.lastUpdated).toLocaleString());
        // console.log(result);
        pullFromServer = false;
        console.log('Saved Online Copy Successsfully');
      }else{
        pullFromServer = false;
        console.log('Not Saving Online version because report date is behind');
        // console.log('Failed to save Online version');
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
  await $.get(domain + '/getDriverReport', async function (drivers) {
    if(drivers.length > 0){
      console.log('Processing Local Report');
      console.log(drivers);
      if(drivers[(drivers.length - 1)].lastUpdated != null){
        totalStops = await drivers.reduce((accumulator, driver) => {
                        return accumulator + driver.manifest.length;
                      }, 0);
        // console.log("total Stop Count is: "+ totalStops);
        let result = await displayReport(drivers);
        drivers = result.drivers;
        
        if(totalOnlinePulls > 0){
          updateLoadStatus("Saving Changes...")
          // result = await saveDriverStatus(response[0]._id, updatdReport);
        }else{
          updateLoadStatus("Finalizing Local Report...")
        }

        if(result.lastUpdated){
          $('#lastUpdated').text(' Last Updated: ' + result.lastUpdated);
          // console.log(result);
          pullFromServer = false;
          // console.log('Saved Online Copy Successsfully');
        }else{
           pullFromServer = false;
          // console.log('Failed to Save Online Copy : ' + (result.successfull ? result : "No changes - Total Pulls = "+totalOnlinePulls));
        }
        // console.log(updatdReport);
        if(result.lastUpdated){
          $('#lastUpdated').text(' Last Updated: ' + new Date(result.lastUpdated).toLocaleString());
        }else{
          $('#lastUpdated').text(' Showing Local Report');
        }
      }else{
        onloadReport = drivers;
        $('#driverLength').text(onloadReport.length + " Drivers");
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





async function displayReport(report, opts) {
  $('#reportDetails tbody').html("")
  $('#driverPlaceHolder').removeClass('d-none');
  let reportDateTime = null;
  if(opts){
    if(opts['dateTime']){
      reportDateTime = opts['dateTime'];
      console.log("Pulling Infomations for the :"+ new Date(reportDateTime).getDate() + "th");
    }
  } 
  let bigHtml="";
  let driverStatus = [];
  let driverCount = 0;
  let drivers = report;
  totalOnlinePulls = 0;
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
    let pmls = [];
    let load = [];
    let attempts = [];
    let pattempts = [];
    let problemStops = [];
    let html = '<tr class="table-bordered">';
    html += '<td>'+driver.driverNumber+'</td>';
    let driverName = driver.driverName;
    console.log("Working on _ "+ driverName);

    // driver.driverName = driverName;
    var latestEvent = ((new Date((reportDateTime? reportDateTime :new Date()))).setHours(0,0,0,0));
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

      try {
        if(stop.Events != 404){
          if(!stop.Events){
            console.log("no local events found, puling from external source");
            let info = await getTrackingnInfo(stop.barcode);
            if(info != 'ERR_CONNECTION_RESET'){
              if(reportDateTime){
                let todaysInfo = await todaysEvents(info, reportDateTime);
                stop.Events = todaysInfo;
              }else{
                stop.Events = info;
              }
            }else{
              stop.Events = 404;
            }
            totalOnlinePulls++; 
          }else if((await isDelivered(stop))){
            console.log("Already Delivered. not puling from external source");
          }else if(pullFromServer){
            let attempted = await isAttempted(stop);
            // console.log("Old Events Says: Attempted");
            let oldInfo = stop.Events;
            let info = await getTrackingnInfo(stop.barcode);
            if(info != 'ERR_CONNECTION_RESET'){
              if(reportDateTime){
                let todaysInfo = await todaysEvents(info, reportDateTime);
                // console.log(todaysInfo);
                stop.Events = todaysInfo;
              }else{
                stop.Events = info;
              }
              if(!(await isDelivered(stop) || await isAttempted(stop))){
                // console.log("New Events from new pull");
                // console.log(stop.Events);
                stop.Events = oldInfo;
                // console.log("stop is still not delivered, reverting to OLD INfo");
              }
            }else{
              stop.Events = 500;
            }
            totalOnlinePulls++;
            // console.log(stop);
          }
        }

        if(stop.Events != 404 && stop.Events != 500){
          let stopEventTime = (new Date(stop.Events[0].UtcEventDateTime)).getTime()
          
          if(stopEventTime > latestEvent){
            latestEvent = stopEventTime;
          }

          let delivered = await isDelivered(stop);
          let attempted = await isAttempted(stop);
          let isInMLS = await isMLS(stop);
          let OFD = await isOFD(stop);
          if(stop.lastScan){ // this makes sure that only pieces that wew scanned are taken into consideration of displaying on delivered or attempts...e.t.c 
            if(delivered){
                del.push(stop);
            }else if(OFD){
              // console.log(stop);
                if(stop.isPriority){
                  pofd.push(stop);
                }else{
                  ofd.push(stop);
                }
            }else if(attempted){
                if(stop.isPriority){
                  pattempts.push(stop);
                }else{
                  attempts.push(stop);
                }
            }else if(isInMLS){
                
                if(stop.isPriority){
                  pmls.push(stop);
                }else{
                  mls.push(stop);
                }
            }else{
              console.log("Cant Process Package: ", stop.barcode);
              console.log("Cant Process Package: ", stop.Events[0]);
              problemStops.push(stop);
            }
          }else{ //add whaever that doesent have a last scanned on it to MLS and edit the status to show that.

            if(delivered){
              if(!stop.Events[0].Status.includes("MLS"))
              stop.Events[0].Status = stop.Events[0].Status + ' | MLS';  
              
                if(stop.isPriority){
                  pmls.push(stop);
                }else{
                  mls.push(stop);
                }
            }else if(OFD){
                
                if(stop.isPriority){
                  if(!stop.Events[0].Status.includes("MLS"))
                  stop.Events[0].Status = stop.Events[0].Status + ' | MLS';
                  pmls.push(stop);
                }else{
                  if(!stop.Events[0].Status.includes("MLS"))
                  stop.Events[0].Status = stop.Events[0].Status + ' | MLS';
                  mls.push(stop);
                }
            }else if(attempted){
                  if(!stop.Events[0].Status.includes("MLS"))
                  stop.Events[0].Status = stop.Events[0].Status + ' | MLS';
                  
                  if(stop.isPriority){
                    pmls.push(stop);
                  }else{
                    mls.push(stop);
                  }
            }else if(isInMLS){
                if(!stop.Events[0].Status.includes("MLS"))
                stop.Events[0].Status = stop.Events[0].Status + ' | MLS';
                if(stop.isPriority){
                  pmls.push(stop);
                }else{
                  mls.push(stop);
                }
            }else{
              console.log("Cant Process Package: "+ stop.barcode);
              console.log(driverName);
              console.log(stop.name);
              console.log(stop.Events[0].EventCode === 'FOTO');
              problemStops.push(stop);
            }
          }
          code = {EventCode:stop.Events[0].EventCode, EventShortDescription:stop.Events[0].EventShortDescription, 
                  details:{driver:driverName, stopName:stop.name, barcode:stop.barcode}};
          
          eventCodes.some(c => c.EventCode == code.EventCode)? null : eventCodes.push(code);
        }
      } catch (error) {
        console.log("Error Caught?");
        console.log(error);
        problemStops.push(stop);
      }
    } // End of Manifest Loop

    let loadNumber = ofd.length + attempts.length + del.length;
    let progressCalc = Math.trunc(((del.length + attempts.length)/loadNumber) * 100);
    progress = (isNaN(progressCalc) ? 0 : progressCalc);
    
    html += '<td>'+driverName+'</td>';
    html += '<td> <a class="btn p-0 m-0" driverNumber="'+driver.driverNumber+'" stopType="load" onclick="showDetailedStops(this)">'+(loadNumber)+'</a></td>';
    html += '<td> <a class="btn p-0 m-0" driverNumber="'+driver.driverNumber+'" stopType="ofd" '+(ofd.length? 'onclick="showDetailedStops(this)"' : '')+'>'+ ofd.length +'</a></td>';
    html += '<td> <a class="btn p-0 m-0" driverNumber="'+driver.driverNumber+'" stopType="pofd" '+(pofd.length? 'onclick="showDetailedStops(this)"' : '')+'>'+ pofd.length +'</a></td>';
    html += '<td> <a class="btn p-0 m-0" driverNumber="'+driver.driverNumber+'" stopType="del" '+(del.length? 'onclick="showDetailedStops(this)"' : '')+'>'+ del.length +'</a></td>';
    html += '<td> <a class="btn p-0 m-0 '+(pattempts.length ? 'text-danger':'' )+'" driverNumber="'+driver.driverNumber+'" stopType="attempts" '+((pattempts.length + attempts.length)? 'onclick="showDetailedStops(this)"' : '')+'>'+ (pattempts.length + attempts.length) +'</a></td>';
    html += '<td> <a class="btn p-0 m-0 '+(pmls.length ? 'text-danger':'' )+'" driverNumber="'+driver.driverNumber+'" stopType="mls" '+((pmls.length + mls.length)? 'onclick="showDetailedStops(this)"' : '')+'>'+ (pmls.length + mls.length) +'</a></td>';
    html += '<td> <div class="progress bg-secondary"> <div class="progress-bar '+(progress > 99? "bg-success" : ((progress > 30) ? "bg-warning": "bg-danger"))+'" role="progressbar" style="width: '+progress+'%;"'
                  +'aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">'+progress+'%</div></div></td>';
    html += '<td>'+new Date(latestEvent).toLocaleString()+'</td>';
    html+="</tr>";
    let quickHtml = html;
    bigHtml += html;

    if(driverCount >= drivers.length){
      $('#driverPlaceHolder').addClass('d-none');
    }
    if(progress > 99){
      $('#reportDetails tbody').append(quickHtml);
    }else{
      $('#reportDetails tbody').prepend(quickHtml);
    }
    html="";
    // driverStatus.push({name:driverName, driverNumber:driver.driverNumber, updatedManifest:{mls:mls,ofd:ofd,del:del,attempts:attempts, problemStops:problemStops}});
    // driverStatus.push({name:driverName, driverNumber:driver.driverNumber, updatedManifest:{mls:mls, pmls:pmls, ofd:ofd, pofd:pofd, del:del, pattempts:pattempts, attempts:attempts, problemStops:problemStops}})
    saveIndividualDriverStatus(driver).then((res) => {
      console.log('saved', res);
    });
    
    clientDeiverStatus.push({name:driverName, driverNumber:driver.driverNumber, updatedManifest:{mls:mls, pmls:pmls, ofd:ofd, pofd:pofd, del:del, pattempts:pattempts, attempts:attempts, problemStops:problemStops}})
  } //End of Driver Loop

  // clientDeiverStatus = driverStatus;
  console.log("Total Pulls: "+totalOnlinePulls);
  if(eventCodes.problemStops.length > 0){
    console.log(eventCodes);
  }
  console.log(eventCodes);
  return {drivers:drivers, lastUpdated:new Date().toLocaleString()};
}

async function showDetailedStops(evt){
  $('#detailModalTable thead').show();
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
    stopArray = [...driver.updatedManifest.pmls,...driver.updatedManifest.mls];
  }else if (stopType == "ofd"){
    stopArray = driver.updatedManifest.ofd;
  }else if (stopType == "pofd"){
    stopArray = driver.updatedManifest.pofd;
  }else if (stopType == "load"){
    stopArray = [...driver.updatedManifest.pofd,...driver.updatedManifest.ofd,...driver.updatedManifest.del,...driver.updatedManifest.pattempts,...driver.updatedManifest.attempts];
  }else if (stopType == "del"){
    stopArray = driver.updatedManifest.del;
  }else if (stopType == "attempts"){
    stopArray = [...driver.updatedManifest.pattempts,...driver.updatedManifest.attempts];
  }else if (stopType == "problemStops"){
    stopArray = driver.updatedManifest.problemStops;
  }
  
  for await (const stop of stopArray){
    let html = '<tr class="table-bordered">';
    let barcodeColor = (await (isPriority(stop))) ? "link-danger" : "link-secondary";  
    html += '<td> <a class="'+barcodeColor+' link-offset-2" href="https://triumphcourier.com/barcodetool/track/'+(stop.barcode)+'" target="_blank">'+(stop.barcode)+' <i class="bi bi-search"></i></a></td>';
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



async function showUploadedDrivers(){
  $('#detailModalTable thead').hide();
  $('#detailModalTable tbody').html("");
  stopType = "List of Those who uploaded";
  driverNames = [];
  if(onloadReport){
    for await(driver of onloadReport.drivers){
      driverName = await getDriverName(driver.driverNumber); 
      driverNames.push(driverName);
    }
  }

  
  for await (const name of driverNames){
    let html = '<tr class="table-bordered">';
    let barcodeColor = "link-secondary";  
    html += '<td colspan="10"> '+ name +'</td>';
    html+="</tr>";
    $('#detailModalTable tbody').append(html);
  }

  $("#detailsHeader").text(stopType.toUpperCase());
  
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

function getTrackingURL2() {
  return new Promise((resolve, reject) => {
    $.get(domain + '/getLSURL', function(data) {
      // console.log('Tracking URL Acquired');
      resolve(data);
    }).fail(function(error) {
      reject(error);
    });
  });
}

function getTrackingURL() {
  return new Promise((resolve, reject) => {
    $.get(domain + '/getTURL', function(data) {
      // console.log('Tracking URL Acquired');
      resolve(data);
    }).fail(function(error) {
      reject(error);
    });
  });
}

function getPriorityBrands() {
  return new Promise((resolve, reject) => {
    $.get(domain + '/getPriorityBrands', function(data) {
      resolve(data);
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


async function saveIndividualDriverStatus(driver) {
    let url = domain + '/saveIndividualDriverStatus';
    await $.post(url, {driver:driver}, function(result) {
      if(result.successfull){
        return result;
      }else{
        console.log(result.msg);
        return(result);
      }
    }).fail(function(error) {
      console.log("Handling an API call error");
      return(error);
    }).catch(err => {
      console.log("Error Saving: "+ driver.driverName);
    })
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


async function getTrackingnInfo(trackingNumber){
  return new Promise(async function (resolve, reject){
    let alternativeTracking = $("#alternativeTracking").is(":checked");
    if(!alternativeTracking){
      $.get(trackingResource+trackingNumber, function(details,status){
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
      }).catch(async (err) =>{
        if(err.status === 404){
          console.log("Tracking Number ("+trackingNumber+"): Status Returned: " + err.statusText);
          console.log("Trying alternative Search");
          alternativeSearch = await alternativeTrack(trackingNumber);
          // console.log(alternativeSearch);
          resolve(alternativeSearch); 
        }else{
          console.log("Something Happened");
          resolve("ERR_CONNECTION_RESET");
        }
      })
    }else{
      $.get(trackingResource2+trackingNumber+"/json", async function(details,status){
        // console.log("tracking with alternativeTracking: " + trackingResource2);
        // console.log(details);
        if(details){
          let modifiedEvents = [];
          for await (const event of details.Events){
            let me = {City : event.City, Country : event.Country, EventCode : event.EventModifier, EventLongDescription : (event.EventLongText)? event.EventLongText : "", 
              EventShortDescription : (event.EventShortText)? event.EventShortText : "", PostalCode : event.PostalCode, State : event.State, Status : event.EventType, UtcEventDateTime : event.UTCDateTime};
            if(event.PhotoPath){
              // console.log("stop Has a VPOD");
              me.vpodPath = event.PhotoPath; 
            }
            modifiedEvents.push(me);
          }

          resolve(modifiedEvents)
        }else{
          resolve("ERR: Cant find info")
        }
      }).catch((err) =>{
        if(err.status === 404){
          console.log("Tracking Number ("+trackingNumber+"): Status Retuend: " + err.statusText);
          // console.log();
          resolve(err.status); 
        }else{
          console.log("Something Happened");
          resolve("ERR_CONNECTION_RESET");
        }
      })
    }

  });
}


async function alternativeTrack(trackingNumber){
  return new Promise(async function (resolve, reject){

  await $.get(trackingResource2+trackingNumber+"/json", async function(details,status){
        // console.log("tracking with alternativeTracking: " + trackingResource2);
        // console.log(details);
        if(details){
          let modifiedEvents = [];
          for await (const event of details.Events){
            let me = {City : event.City, Country : event.Country, EventCode : event.EventModifier, EventLongDescription : (event.EventLongText)? event.EventLongText : "", 
              EventShortDescription : (event.EventShortText)? event.EventShortText : "", PostalCode : event.PostalCode, State : event.State, Status : event.EventType, UtcEventDateTime : event.UTCDateTime};
            if(event.PhotoPath){
              // console.log("stop Has a VPOD");
              me.vpodPath = event.PhotoPath; 
            }
            modifiedEvents.push(me);
          }

          resolve(modifiedEvents)
        }else{
          resolve("ERR: Cant find info")
        }
      }).catch((err) =>{
        if(err.status === 404){
          console.log("Tracking Number ("+trackingNumber+"): Alternative Search Returnd: " + err.statusText);
          // console.log();
          resolve(err.status); 
        }else{
          console.log("Something Happened");
          resolve("ERR_CONNECTION_RESET");
        }
      })
  });
}


async function isPriority(stop) {
  if(priorityBrands !=null){
    result = await priorityBrands.some(p => (p.name).toLowerCase() == (stop.brand).toLowerCase());
    return result;
  }else{
    console.log("Unable to Check for Priority");
    return false;
  }
}



async function isDelivered(stop) {
  if(stop.Events[0].EventCode === 'DLVD' || stop.Events[0].EventCode === 'FOTO' 
    || (stop.Events[0].EventCode === 'CL' && stop.Events[0].EventShortDescription.includes('Delivered'))
    || stop.Events[0].Status.includes('Delivered') 
    || stop.Events[0].Status.includes('Miscellaneous') 
    || stop.Events[0].EventShortDescription.includes('Select the camera') 
    || stop.Events[0].EventShortDescription.includes('Delivered.')){
    return true; 
  }else{
   return false;
  }
}


async function isAttempted(stop) {
  if(stop.Events[0].EventCode === 'NH' || stop.Events[0].EventCode === 'UTLV' 
    || stop.Events[0].EventCode === 'NDMI' 
    || stop.Events[0].EventCode === 'ACSS' 
    || stop.Events[0].EventCode === 'BCLD' 
    || stop.Events[0].Status.includes('Attempted')
    || ((stop.Events[0].Status.includes('Pending')
    || stop.Events[0].EventShortDescription.includes('Delayed. Delivery date updated.') ) && (! mslEvents.includes(stop.Events[0].EventCode)))){
      return true;
    }else{
      return false;
    }
}


async function isOFD(stop) {
  if(stop.Events[0].EventCode === 'OFDL' || stop.Events[0].EventCode === 'OD' || stop.Events[0].EventShortDescription.includes('Out for delivery.')){
    return true;
  }else{
    return false;
  }
}

async function isMLS(stop) {
  if(stop.Events[0].EventCode === 'RD' 
    || stop.Events[0].EventCode === 'UD' 
    || stop.Events[0].EventCode === 'ONHD'
    || stop.Events[0].EventCode === 'LOST'
    || stop.Events[0].EventCode === 'HW'
    || stop.Events[0].EventCode === 'DWDD'
    || stop.Events[0].EventCode === 'EMAR' 
    || stop.Events[0].EventCode === 'EMAD' 
    || stop.Events[0].EventCode === 'RB' 
    || stop.Events[0].EventCode === 'SFCT' 
    || stop.Events[0].EventCode === 'LOAD'
    || stop.Events[0].EventCode === 'CR'
    || stop.Events[0].Status.includes('Returned')
    || stop.Events[0].Status.includes('Undeliverable')
    || stop.Events[0].EventShortDescription.includes('Packaged received at the facility.') 
    || stop.Events[0].EventShortDescription.includes('Returned. Contact sender.')
    || stop.Events[0].EventShortDescription.includes('Damaged. Contact sender.')){
      return true;
    }else{
      return false;
    }
  
}


async function newerEvent(events1, events2) {
  events1Time = new Date(events1[0].UtcEventDateTime).getTime();
  events2Time = new Date(events2[0].UtcEventDateTime).getTime();
  if(events1Time > events2Time){
    return events1;
  }else{
    return events2;
  }
}

async function todaysEvents(events, dateTime){
  let finalEvents = [];
  let today = (new Date(dateTime)).setHours(0,0,0,0);
  let date = today.getDate();
  let reversedEvents = [...events].reverse();
  for await(event of reversedEvents){
    eventDate = new Date(event.UtcEventDateTime).setHours(0,0,0,0);
    if(eventDate <= date){
      finalEvents.push(event);
    }
  }
  return finalEvents;
}





