let domain = $('#domain').attr('domain');
let trackingResource = "";
let trackingResource2 = "";
let EXTRACTINGURL = "";
let priorityBrands = null;
let drivers = [];
let clientDeiverStatus = [];
let clientWeeklyStatus = [];
let totalStops = 0;
let stopCount = 0;
let totalOnlinePulls = 0;
let eventCodes = [];
let stopReportPull = false;
let pullFromServer = false;
eventCodes.problemStops = [];
let onloadReport = null;
let totalOFD = NaN;
let selectedReportDateTime = (new Date().setHours(0,0,0,0));
let globalTimer = 0;
let mouseIsDown = false;

window.onload = async (event) => {
  $("#deliveryReport-nav-button").click(); //simulates the show action for the nav tabls
  trackingResource = await getTrackingURL();
  trackingResource2 = await getTrackingURL2();
  EXTRACTINGURL = await getExtractingURL();
  priorityBrands = await getPriorityBrands();
  update = await pullLocalReport();
};

let sideBarMenu = $("#sidebarMenu");

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
                      setTotalOFD
      let result = await displayReport(drivers, {updateWeekly:true});
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
      $('#reportDetails tbody').html("");
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
  await $.get(domain + '/getDriverReport/'+dateTime, async function (drivers) {
    if(drivers.length > 0){
      console.log('Processing Past Report');
      console.log(drivers);
      totalStops = await drivers.reduce((accumulator, driver) => {
                        return accumulator + driver.manifest.length;
                      }, 0);
      let updatedDrivers = await displayReport(drivers, {updateWeekly:false, dateTime:dateTime});
      drivers = updatedDrivers.drivers;
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
      $("#extractPastReportButton").removeClass("disabled");
      $("#pullRequestButton").html('Pull Report');
      $('#sync-warning').addClass("d-none");
    }else{
      console.log("No Driver Manifests Report Found at the Moment");
      $('#reportDetails tbody').html("");
      $('#sync-warning').text("Hmm.... it looks No Driver Manifests has been submitted to designated email.");
      $('#sync-warning').removeClass("d-none");
      $("#pullRequestButton").removeClass("disabled");
      $("#pullRequestButton").html('Pull Report');
      $("#extractPastReportButton").removeClass("disabled");
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
        let result = await displayReport(drivers, {updateWeekly:false} );
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
      }else{ // if we havent pulled from server
        // onloadReport = drivers;
        offlineReport = await displayOfflineReport(drivers);
        $('#driverLength').text(offlineReport?.drivers?.length + " Drivers");
        $('#sync-warning').removeClass("d-none");
      }
      $("#pullRequestButton").removeClass("disabled");
      $("#pullRequestButton").html('Pull Report');
      console.log("Manifest not in Sync With Ontrac Server");

    }else{
      console.log("No Driver Manifests Report Found at the Moment");
      $('#reportDetails tbody').html("");
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
  let updateWeekly = false;
  if(opts){
    if(opts['dateTime']){
      reportDateTime = opts['dateTime'];
      console.log("Pulling Infomations for the :"+ new Date(reportDateTime).getDate() + "th");
    }
    if(opts['updateWeekly']){
      updateWeekly = opts['updateWeekly'];
      console.log("UpdateWeeklyReport is set to : ",updateWeekly);
    }
  }
  
  totalOFD = 0;
  let bigHtml="";
  let driverStatus = [];
  let driverCount = 0;
  let drivers = report;
  totalOnlinePulls = 0;
  let totalOnlineDriverPulls = 0;
  stopCount = 0;
  mslEvents = ['ONHD','HW','DWDD','EMAR','RB','LOAD','SFCT','Returned','CR'];


  drivers.lastUpdated = report[0].lastUpdated;

  for await(const driver of drivers ){
    totalOnlineDriverPulls = 0;
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
    let html = '<tr id="'+ driver.driverNumber + '-report" class="table-bordered">';
    html += '<td>'+driver.driverNumber+'</td>';
    let driverName = driver.driverName ?? await getDriverName(driver.driverNumber);
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
              stop.Events = 500;
            }
            totalOnlinePulls++;
            totalOnlineDriverPulls ++;
          }else if(stop.lastScan === 'Delivered' || (await isDelivered(stop))){
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
            totalOnlineDriverPulls++;
            // console.log(stop);
          }
        }else{
          console.log("Last pull resulted in ERR_500, trying again");
          let info = await getTrackingnInfo(stop.barcode);
          if(info != 'ERR_CONNECTION_RESET'){
            if(reportDateTime){
              let todaysInfo = await todaysEvents(info, reportDateTime);
              stop.Events = todaysInfo;
            }else{
              stop.Events = info;
            }
          }else{
            stop.Events = 500;
          }
          totalOnlinePulls++;
          totalOnlineDriverPulls ++;
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
                stop.lastScan = 'Delivered';
                del.push(stop);
            }else if(OFD){
              totalOFD++;
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
                stop.lastScan = 'Delivered';
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
    html += '<td>'+new Date(latestEvent).toLocaleString()+'<span> <i driverNumber="'+driver.driverNumber+'" onclick="fetchDriverUpdate(this)" class="bi bi-arrow-clockwise"></i> </span></td>';
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
    driverStatus.push({ _id:driver._id, driverName:driverName, date:driver.date, driverAllias:driver.driverAllias, driverNumber:driver.driverNumber, lastUpdated:latestEvent, manifest:{mls:mls, pmls:pmls, ofd:ofd, pofd:pofd, del:del, pattempts:pattempts, attempts:attempts, problemStops:problemStops}});
    if(isTodayReport(driver.date)){
      if(totalOnlineDriverPulls){
        saveIndividualDriverStatus(driver).then((res) => {
          console.log('saved', res);
        });
      }else{
        console.log("NOT SAVING - Total OnlonePull: ", totalOnlineDriverPulls);
      }
    }else{
      console.log("Backdateed Report! DO NOT SAVE");
    }
    
  } //End of Driver Loop

  clientDeiverStatus = driverStatus;
  console.log("Total Pulls: "+totalOnlinePulls);
  if(eventCodes.problemStops.length > 0){
    console.log(eventCodes);
  }
  setTotalOFD(totalOFD, {updateWeekly:updateWeekly});
  console.log(eventCodes);
  return {drivers:drivers, lastUpdated:new Date().toLocaleString()};
}


async function displayOfflineReport(report, opts) {
  $('#reportDetails tbody').html("")
  $('#driverPlaceHolder').removeClass('d-none');
  let reportDateTime = null;
  if(opts){
    if(opts['dateTime']){
      reportDateTime = opts['dateTime'];
      console.log("Pulling Infomations for the :"+ new Date(reportDateTime).getDate() + "th");
    }
  }
  totalOFD = 0;
  let bigHtml="";
  let driverStatus = [];
  let driverCount = 0;
  let drivers = report;
  // totalOnlinePulls = 0;
  // let totalOnlineDriverPulls = 0;
  stopCount = 0;
  mslEvents = ['ONHD','HW','DWDD','EMAR','RB','LOAD','SFCT','Returned','CR'];


  drivers.lastUpdated = report[0].lastUpdated;

  for await(const driver of drivers ){
    // totalOnlineDriverPulls = 0;
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
    let html = '<tr id="'+driver.driverNumber+'-report" class="table-bordered">';
    html += '<td>'+driver.driverNumber+'</td>';
    let driverName = driver.driverName ?? await getDriverName(driver.driverNumber);
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
      // console.log(stop.Events);
      // console.log(stop.Events);
      // if(){
        if(stop.lastScan){
          // let stopEventTime = (new Date(stop.Events[0].UtcEventDateTime)).getTime()
          
          // if(stopEventTime > latestEvent){
          //   latestEvent = stopEventTime;
          // }
          // console.log(stop);
          let delivered = (stop.Events && stop.Events[0] != 404)? await isDelivered(stop) : (stop.lastScan === "Delivered");
          let attempted = (stop.Events && stop.Events[0] != 404)? await isAttempted(stop) : (stop.lastScan === "Attempted");
          let isInMLS = (stop.Events && stop.Events[0] != 404)? await isMLS(stop) : (stop.lastScan === "");
          let OFD = (stop.Events && stop.Events[0] != 404)? await isOFD(stop) : (stop.lastScan === "Loaded");
          if(stop.lastScan){ // this makes sure that only pieces that wew scanned are taken into consideration of displaying on delivered or attempts...e.t.c 
            if(delivered){
                del.push(stop);
            }else if(OFD){
                totalOFD ++;
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
              console.log("Cant Process Package: ", stop.lastScan);
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
              problemStops.push(stop);
            }
          }
          // code = {EventCode:stop.Events[0].EventCode, EventShortDescription:stop.Events[0].EventShortDescription, 
          //         details:{driver:driverName, stopName:stop.name, barcode:stop.barcode}};
          
          // eventCodes.some(c => c.EventCode == code.EventCode)? null : eventCodes.push(code);
        }else{
          // if package isnt scanned
          let isInMLS = stop.lastScan === "" ?? false;
          if(isInMLS){
              if(stop.isPriority){
                pmls.push(stop);
              }else{
                mls.push(stop);
              }
            }
        }
      // }else{
        // console.log('problemStop Encountered', stop);
      // }
    
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
    html += '<td>'+new Date(latestEvent).toLocaleString()+'<span> <i driverNumber="'+driver.driverNumber+'" onclick="fetchDriverUpdate(this)" class="bi bi-arrow-clockwise"></i> </span></td>';
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
    driverStatus.push({_id:driver._id, driverName:driverName, date:driver.date, driverAllias:driver.driverAllias, driverNumber:driver.driverNumber, lastUpdated:latestEvent, manifest:{mls:mls, pmls:pmls, ofd:ofd, pofd:pofd, del:del, pattempts:pattempts, attempts:attempts, problemStops:problemStops}});
   
    
  } //End of Driver Loop

  clientDeiverStatus = driverStatus;
  console.log("Total Pulls: "+totalOnlinePulls);
  // if(eventCodes.problemStops.length > 0){
  //   console.log(eventCodes);
  // }
  // console.log(eventCodes);
  return {drivers:drivers, lastUpdated:new Date().toLocaleString()};
}


async function fetchPastReport(){
  console.log("Final selectedDate: ", new Date(selectedReportDateTime));
  $("#extractPastReportButton").addClass("disabled");
  await pullPastReport(selectedReportDateTime);
  
}

async function showDetailedStops(evt){
  $('#detailModalTable thead').show();
  $('#detailModalTable tbody').html("");
  stopType = $(evt).attr("stopType");
  driverNumber = Number($(evt).attr("driverNumber"));

  // console.log(drivers);
  driver = await clientDeiverStatus.find((d) => d.driverNumber === driverNumber);
  driverName = driver.driverName;
  // console.log(driver);
  stopArray = [];
  // console.log(stopArray);
  if(stopType == "mls"){
    stopArray = [...driver.manifest.pmls,...driver.manifest.mls];
  }else if (stopType == "ofd"){
    stopArray = driver.manifest.ofd;
  }else if (stopType == "pofd"){
    stopArray = driver.manifest.pofd;
  }else if (stopType == "load"){
    stopArray = [...driver.manifest.pofd,...driver.manifest.ofd,...driver.manifest.del,...driver.manifest.pattempts,...driver.manifest.attempts];
  }else if (stopType == "del"){
    stopArray = driver.manifest.del;
  }else if (stopType == "attempts"){
    stopArray = [...driver.manifest.pattempts,...driver.manifest.attempts];
  }else if (stopType == "problemStops"){
    stopArray = driver.manifest.problemStops;
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
    html += '<td> '+ ((stop.Events? stop.Events[0].Status : null) ?? stop.lastScan) + '</td>';
    html += '<td>'+ (new Date((stop.Events? stop.Events[0].UtcEventDateTime : false) ?? driver.date).toLocaleString()) + '</td>';
    html += "</tr>";
    $('#detailModalTable tbody').append(html);
  }

  $("#detailsHeader").text(stopType.toUpperCase()+ " | " + driverNumber + " | "+driverName + " [" + stopArray.length + "]");
  
  const stopsDetailed = new bootstrap.Modal('#detailModal', {
    keyboard: true
  })
  stopsDetailed.show();
}



function showDateModal() {
    selectedReportDateTime = new Date().setHours(0,0,0,0); //reset the selected reportr date to today
    const days = getPastDates()//returns an array of the past thirty date object
    $('.calendar').html("");
    let i = 0; // max = days.length
    let today = new Date();
    // displayMonth(days[i]);
    let calendarDatesHtml = "";
    for (const day of days){
      // console.log("today: ", today.setHours(0,0,0,0), " ; Day: ", day.setHours(0,0,0,0));
      // console.log('t:', today, 'd', day );
      // console.log('t-time:', today.getTime(), 'd-time', day.getTime() );
      if (today.getDate() === day.getDate()){
        calendarDatesHtml += '<div class="col  text-center" value="' + day.getTime() + '" onclick="selectDate(this)"> <div class="btn dateButton today border-accent-subtle rounded px-2"> ' + day.toDateString() + '</div> </div>';
      }else{
        calendarDatesHtml += '<div class="col  text-center" value="' + day.getTime() + '" onclick="selectDate(this)"> <div class="btn dateButton border rounded px-2 "> ' + day.toDateString() + '</div> </div>';
      }
    }

    $('.calendar').append(calendarDatesHtml);
}



function displayMonth(day) {
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const d = new Date(day.date);
  const today = new Date();
  $("#monthDisplay").val(monthNames[d.getMonth()] + " " + d.getFullYear());
  $("[data-month]").attr("data-month", "" + d.getMonth());

  const nextMonth = d.getMonth() + 1;
  if (today.getMonth() + 1 > d.getMonth()) {
    $("#nextMonthButton").val(nextMonth);
    $("#nextMonthButton").removeAttr("disabled");
  } else {
    $("#nextMonthButton").attr("disabled", "");
  }

  const prevMonth = d.getMonth() - 1;
  if (today.getMonth() < d.getMonth()) {
    $("#prevMonthButton").val(prevMonth);
    $("#prevMonthButton").removeAttr("disabled");
  } else {
    $("#prevMonthButton").attr("disabled", "");
  }
}


async function sortBy(evt){
  let key = $(evt).attr('data');
  switch (key) {
    case "name":
      await clientDeiverStatus.sort(function (a,b){
          if (a.driverName[0] > b.driverName[0]) {
              return 1;   
          }else if (a.driverName[0] < b.driverName[0]){
              return -1;
          }else{
            if (a.driverName[1] > b.driverName[1]) {
                return 1;   
            }else if (a.driverName[1] < b.driverName[1]){
                return -1;
            }else{
              return 0;
            }
        }
      });
      break;
    case "driverNumber":
      await clientDeiverStatus.sort(function (a,b){
          if (a.driverNumber > b.driverNumber) {
              return 1;   
          }else if (a.driverNumber < b.driverNumber){
              return -1;
          }else{
              return 0;
          }
      });
      break;
    case "load":
      await clientDeiverStatus.sort(function (a,b){
        if ( (a.manifest.ofd.length + a.manifest.del.length + a.manifest.attempts.length) > (b.manifest.ofd.length + b.manifest.del.length + b.manifest.attempts.length)) {
            return 1;   
        }else if ((a.manifest.ofd.length + a.manifest.del.length + a.manifest.attempts.length) < (b.manifest.ofd.length + b.manifest.del.length + b.manifest.attempts.length)){
            return -1;
        }else{
            return 0;
        }
      });
      break;
    default:
    await clientDeiverStatus.sort(function (a,b){
      if ( a.manifest[key].length  > b.manifest[key].length ) {
          return 1;   
      }else if (a.manifest[key].length  < b.manifest[key].length ){
          return -1;
      }else{
          return 0;
      }
    });
    break;
  }
  await displayReportWithClientStauts(clientDeiverStatus);
}





async function sortWeeeklyBy(evt){
  let key = $(evt).attr('data');
  switch (key) {
    case "name":
      await clientWeeklyStatus.sort(function (a,b){
          if (a.driverName[0] > b.driverName[0]) {
              return 1;   
          }else if (a.driverName[0] < b.driverName[0]){
              return -1;
          }else{
              return 0;
          }
      });
      break;
    case "total":
      await clientWeeklyStatus.sort(function (a,b){
        if ( (a.total) > (b.total)) {
            return 1;   
        }else if ((a.total) < (b.total)){
            return -1;
        }else{
            return 0;
        }
      });
      break;
    default:
    await clientWeeklyStatus.sort(function (a,b){
      if ( a[key].length  > b[key].length ) {
          return 1;   
      }else if (a[key].length  < b[key].length ){
          return -1;
      }else{
          return 0;
      }
    });
    break;
  }
  await displayWeeklyReportWithClientStauts(clientWeeklyStatus);
}


async function fetchDriverUpdate(evt){
  let driverNumber = Number($(evt).attr('driverNumber'));
  let driverIndex = clientDeiverStatus.findIndex(d => d.driverNumber === driverNumber);
  let reportDateTime = null;
  let totalOnlinePulls = 0;
  $('#'+driverNumber +'-report').addClass("opacity-25")
    console.log("diverIndex: ", driverIndex);
    let ofd = [];
    let pofd = [];
    let del = [];
    let mls = [];
    let pmls = [];
    let load = [];
    let attempts = [];
    let pattempts = [];
    let problemStops = [];
    let html = '<tr id="'+driverNumber+'-report" class="table-bordered">';
    html += '<td>'+driverNumber+'</td>';
    let driverName = clientDeiverStatus[driverIndex].driverName ?? await getDriverName(driverNumber);
    console.log("Working on _ "+ driverName);

    // driver.driverName = driverName;
    var latestEvent = ((new Date((reportDateTime? reportDateTime :new Date()))).setHours(0,0,0,0));
    let driverOFD = clientDeiverStatus[driverIndex].manifest.ofd.length + clientDeiverStatus[driverIndex].manifest.pofd.length
    totalOFD = totalOFD - driverOFD;
    //loop through all OFD'S and update
    let deliverableStops = [...clientDeiverStatus[driverIndex].manifest.ofd,...clientDeiverStatus[driverIndex].manifest.pofd,
    ...clientDeiverStatus[driverIndex].manifest.attempts, ...clientDeiverStatus[driverIndex].manifest.pattempts,
    ...clientDeiverStatus[driverIndex].manifest.mls,...clientDeiverStatus[driverIndex].manifest.pmls]
    for await(stop of deliverableStops){
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
              stop.Events = 500;
            }
            totalOnlinePulls++;
          }else if((await isDelivered(stop))){
            console.log("Already Delivered. not puling from external source");
          }else{
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
        }else{
          console.log("Last pull resulted in ERR_500, trying again");
          let info = await getTrackingnInfo(stop.barcode);
          if(info != 'ERR_CONNECTION_RESET'){
            if(reportDateTime){
              let todaysInfo = await todaysEvents(info, reportDateTime);
              stop.Events = todaysInfo;
            }else{
              stop.Events = info;
            }
          }else{
            stop.Events = 500;
          }
          totalOnlinePulls++;
          totalOnlineDriverPulls ++;
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
              totalOFD ++;
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
    }// end of deliverable stops loop
    let allManifest = [...deliverableStops, ...clientDeiverStatus[driverIndex].manifest.del]
    // console.log("manifest after creation");
    // console.log(allManifest);
    del = [...del, ...clientDeiverStatus[driverIndex].manifest.del]
    let loadNumber = ofd.length + del.length + attempts.length;
    // console.log("DEL: ", del.length);
    // console.log("OFD: ", ofd.length);
    // console.log("attempts: ", attempts.length);
    // console.log("load: ", loadNumber);
    // console.log("mainfest: ", allManifest.length);

    let progressCalc = Math.trunc(((del.length + attempts.length)/loadNumber) * 100);
    progress = (isNaN(progressCalc) ? 0 : progressCalc);
    
    html += '<td>'+driverName+'</td>';
    html += '<td> <a class="btn p-0 m-0" driverNumber="'+driverNumber+'" stopType="load" onclick="showDetailedStops(this)">'+(loadNumber)+'</a></td>';
    html += '<td> <a class="btn p-0 m-0" driverNumber="'+driverNumber+'" stopType="ofd" '+(ofd.length? 'onclick="showDetailedStops(this)"' : '')+'>'+ ofd.length +'</a></td>';
    html += '<td> <a class="btn p-0 m-0" driverNumber="'+driverNumber+'" stopType="pofd" '+(pofd.length? 'onclick="showDetailedStops(this)"' : '')+'>'+ pofd.length +'</a></td>';
    html += '<td> <a class="btn p-0 m-0" driverNumber="'+driverNumber+'" stopType="del" '+(del.length? 'onclick="showDetailedStops(this)"' : '')+'>'+ del.length +'</a></td>';
    html += '<td> <a class="btn p-0 m-0 '+(pattempts.length ? 'text-danger':'' )+'" driverNumber="'+driverNumber+'" stopType="attempts" '+((pattempts.length + attempts.length)? 'onclick="showDetailedStops(this)"' : '')+'>'+ (pattempts.length + attempts.length) +'</a></td>';
    html += '<td> <a class="btn p-0 m-0 '+(pmls.length ? 'text-danger':'' )+'" driverNumber="'+driverNumber+'" stopType="mls" '+((pmls.length + mls.length)? 'onclick="showDetailedStops(this)"' : '')+'>'+ (pmls.length + mls.length) +'</a></td>';
    html += '<td> <div class="progress bg-secondary"> <div class="progress-bar '+(progress > 99? "bg-success" : ((progress > 30) ? "bg-warning": "bg-danger"))+'" role="progressbar" style="width: '+progress+'%;"'
                  +'aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">'+progress+'%</div></div></td>';
    html += '<td>'+new Date(latestEvent).toLocaleString()+'<span> <i driverNumber="'+driverNumber+'" onclick="fetchDriverUpdate(this)" class="bi bi-arrow-clockwise"></i> </span></td>';
    html+="</tr>";
    let quickHtml = html;
   
    await $('#'+driverNumber+'-report').remove();
    if(progress > 99){
      $('#reportDetails tbody').append(quickHtml);
    }else{
      $('#reportDetails tbody').prepend(quickHtml);
    }
    html=""; 
     
    clientDeiverStatus[driverIndex] = { _id:clientDeiverStatus[driverIndex]._id, driverName:driverName, date:clientDeiverStatus[driverIndex].date, driverAllias:clientDeiverStatus[driverIndex].driverAllias, driverNumber:driverNumber, lastUpdated:latestEvent, manifest:{mls:mls, pmls:pmls, ofd:ofd, pofd:pofd, del:del, pattempts:pattempts, attempts:attempts, problemStops:problemStops}};
    // get the newly updated clientDriverDocument
    savableDriver = {_id:clientDeiverStatus[driverIndex]._id, driverName:driverName, date:clientDeiverStatus[driverIndex].date, driverAllias:clientDeiverStatus[driverIndex].driverAllias, driverNumber:driverNumber, lastUpdated:latestEvent, manifest:allManifest} // replace the savable manifest, with mongodb friendly manifest
    console.log(clientDeiverStatus[driverIndex]);
    console.log(savableDriver);
    setTotalOFD(totalOFD, {updateWeekly:true});
      if(totalOnlinePulls > 0){
        saveIndividualDriverStatus(savableDriver).then((res) => {
          console.log('Sent Save operation call');
        });
      }else{
        console.log("aint saving shit");
      }
  // pullFromServer = false;
}



async function displayReportWithClientStauts(driverStatus){
  $('#reportDetails tbody').html("")
  $('#driverPlaceHolder').removeClass('d-none');

  for await(driver of driverStatus){
    let html = '<tr id="'+driver.driverNumber+'-report" class="table-bordered">';;
    html += '<td>'+driver.driverNumber+'</td>';

    let loadNumber = driver.manifest.ofd.length + driver.manifest.attempts.length + driver.manifest.del.length;
    let progressCalc = Math.trunc(((driver.manifest.del.length + driver.manifest.attempts.length)/loadNumber) * 100);
    let progress = (isNaN(progressCalc) ? 0 : progressCalc);
    
    html += '<td>'+driver.driverName+'</td>';
    html += '<td> <a class="btn p-0 m-0" driverNumber="'+driver.driverNumber+'" stopType="load" onclick="showDetailedStops(this)">'+(loadNumber)+'</a></td>';
    html += '<td> <a class="btn p-0 m-0" driverNumber="'+driver.driverNumber+'" stopType="ofd" '+(driver.manifest.ofd.length? 'onclick="showDetailedStops(this)"' : '')+'>'+ driver.manifest.ofd.length +'</a></td>';
    html += '<td> <a class="btn p-0 m-0" driverNumber="'+driver.driverNumber+'" stopType="pofd" '+(driver.manifest.pofd.length? 'onclick="showDetailedStops(this)"' : '')+'>'+ driver.manifest.pofd.length +'</a></td>';
    html += '<td> <a class="btn p-0 m-0" driverNumber="'+driver.driverNumber+'" stopType="del" '+(driver.manifest.del.length? 'onclick="showDetailedStops(this)"' : '')+'>'+ driver.manifest.del.length +'</a></td>';
    html += '<td> <a class="btn p-0 m-0 '+(driver.manifest.pattempts.length ? 'text-danger':'' )+'" driverNumber="'+driver.driverNumber+'" stopType="attempts" '+((driver.manifest.pattempts.length + driver.manifest.attempts.length)? 'onclick="showDetailedStops(this)"' : '')+'>'+ (driver.manifest.pattempts.length + driver.manifest.attempts.length) +'</a></td>';
    html += '<td> <a class="btn p-0 m-0 '+(driver.manifest.pmls.length ? 'text-danger':'' )+'" driverNumber="'+driver.driverNumber+'" stopType="mls" '+((driver.manifest.pmls.length + driver.manifest.mls.length)? 'onclick="showDetailedStops(this)"' : '')+'>'+ (driver.manifest.pmls.length + driver.manifest.mls.length) +'</a></td>';
    html += '<td> <div class="progress bg-secondary"> <div class="progress-bar '+(progress > 99? "bg-success" : ((progress > 30) ? "bg-warning": "bg-danger"))+'" role="progressbar" style="width: '+progress+'%;"'
                  +'aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">'+progress+'%</div></div></td>';
    html += '<td>'+new Date(driver.lastUpdated).toLocaleString()+'<span> <i driverNumber="'+driver.driverNumber+'" onclick="fetchDriverUpdate(this)" class="bi bi-arrow-clockwise"></i> </span></td>';
    html+="</tr>";
    let quickHtml = html;

    // if(driverCount >= drivers.length){
    //   $('#driverPlaceHolder').addClass('d-none');
    // }
    if(progress > 99){
      $('#reportDetails tbody').append(quickHtml);
    }else{
      $('#reportDetails tbody').prepend(quickHtml);
    }
    html="";
  }
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
    let html = '<tr id="'+driverNumber+'-report" class="table-bordered">';
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

async function getDeliveredStops(manifest) {
  let deliveredStops = [];
  for await (const stop of manifest){
    if((await isDelivered(stop) && !stop.Events[0].Status.includes('MLS'))){
      deliveredStops.push(stop);
    }
  }
  // console.log(deliveredStops);
  return deliveredStops;
}

function getSingleDriverReport(driverNumber, date) {
  return new Promise((resolve, reject) => {
    $.post(domain + '/getSingleDriverReport', {driverNumber:driverNumber, date:date}, 
    async function(driver) {
      if(driver){
        resolve({driver:driver, successfull:true});
      }else{
        resolve({error:new Error("ERR_NOT_FOUND"), successfull:false});
      }
    }).fail(function(error) {
      reject({error:error, successfull:false});
    });
  });
}


function getContractorsList() {
  return new Promise((resolve, reject) => {
    let name = "";
    $.get(domain + '/getContractorsList/', function(data) {
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

function getExtractingURL(){
  return new Promise((resolve, reject) => {
    $.get(domain + '/getExtractingURL', function(data) {
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
        console.log("suceesfful save recorded for: ",driver.driverName);
        return result;
      }else{
        console.log(result.msg);
        return (result);
      }
    }).fail(function(error) {
      console.log("Handling an API call error");
      return (error);
    }).catch(err => {
      console.log("Error Saving: "+ driver.driverName);
    })
}

 function stopPullingProcess() {
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

function updateWeeklyLoadStatus(status) {
  $("#weekly-report-process-status").text(''+ status + '');
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
              EventShortDescription : (event.EventShortText)? event.EventShortText : "", PostalCode : event.PostalCode, State : event.State, Status : event.EventType, UtcEventDateTime : event.DateTime};
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
              EventShortDescription : (event.EventShortText)? event.EventShortText : "", PostalCode : event.PostalCode, State : event.State, Status : event.EventType, UtcEventDateTime : event.DateTime};
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
  if(stop?.isPriority){
    return true;    
  }else{
    if(priorityBrands !=null){
      result = await priorityBrands.some(p => (p.name).toLowerCase() == (stop.brand).toLowerCase());
      return result;
    }else{
      console.log("Unable to Check for Priority");
      return false;
    }
  }
}



async function isDelivered(stop) {
  if(stop.Events[0].EventCode === 'DLVD' || stop.Events[0].EventCode === 'FOTO' 
    || (stop.Events[0].EventCode === 'CL' && stop.Events[0].EventShortDescription.includes('Delivered'))
    || (stop.Events[0].Status ? stop.Events[0].Status.includes('Delivered') : false )  // needs edditing check if properties exists
    || (stop.Events[0].Status ? stop.Events[0].Status.includes('Miscellaneous') : false )  // needs edditing check if properties exists
    || (stop.Events[0].EventShortDescription ? stop.Events[0].EventShortDescription.includes('Select the camera') : false )
    || (stop.Events[0].EventShortDescription ? stop.Events[0].EventShortDescription.includes('Delivered.') : false ) ){
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
    || (stop.Events[0].Status ? stop.Events[0].Status.includes('Attempted') : false )
    || (stop.Events[0].Status ? stop.Events[0].Status.includes('Pending') : false )
    || (stop.Events[0].EventShortDescription ? stop.Events[0].EventShortDescription.includes('Delayed. Delivery date updated.') : false )){
      return true;
    }else{
      return false;
    }
}


async function isOFD(stop) {
  if(stop.Events[0].EventCode === 'OFDL' 
  || stop.Events[0].EventCode === 'OD' 
  || (stop.Events[0].EventShortDescription ? stop.Events[0].EventShortDescription.includes('Out for delivery.') : false )){
    return true;
  }else{
    return false;
  }
}

async function isMLS(stop) {
  if(stop.Events[0].EventCode === 'RD' 
    || stop.Events[0].EventCode === 'UD'
    || stop.lastScan === ''
    || stop.Events[0].EventCode === 'ONHD'
    || stop.Events[0].EventCode === 'LOST'
    || stop.Events[0].EventCode === 'HW'
    || stop.Events[0].EventCode === 'DWDD'
    || stop.Events[0].EventCode === 'EMAR' 
    || stop.Events[0].EventCode === 'EMAD' 
    || stop.Events[0].EventCode === 'EMOH' 
    || stop.Events[0].EventCode === 'INRL' 
    || stop.Events[0].EventCode === 'RB' 
    || stop.Events[0].EventCode === 'RS' 
    || stop.Events[0].EventCode === 'SFCT' 
    || stop.Events[0].EventCode === 'LOAD'
    || stop.Events[0].EventCode === 'CR'
    || stop.Events[0].Status ? stop.Events[0].Status.includes('Returned') : false
    || stop.Events[0].Status ? stop.Events[0].Status.includes('Undeliverable') : false
    || stop.Events[0].EventShortDescription ? stop.Events[0].EventShortDescription.includes('Packaged received at the facility.') : false
    || stop.Events[0].EventShortDescription ? stop.Events[0].EventShortDescription.includes('Returned. Contact sender.') : false
    || stop.Events[0].EventShortDescription ? stop.Events[0].EventShortDescription.includes('Damaged. Contact sender.') : false ){
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
  let today = (new Date(dateTime)).setHours(28,0,0,0);
  // let date = today.getDate();
  if(events != 404 && events != 500){
    for await(event of events){
      eventDate = new Date(event.UtcEventDateTime).setHours(0,0,0,0);
      // console.log("eventDate ", eventDate, " -- today: ", today );
      if(eventDate <= today){
        finalEvents.push(event);
      }
    }
  }else{
    finalEvents = events;
  }
  return finalEvents;
}


function getToday(){
  return (new Date()).setHours(0,0,0,0);
}

async function isTodayReport(reportDate){
  let today = (new Date()).setHours(0,0,0,0);
  let reportDateTime = (new Date(reportDate)).setHours(0,0,0,0);
  return today === reportDateTime;
}


async function setTotalOFD(ofd, opts) {
  updateWeekly = false;
  if(opts){
    updateWeekly = opts.updateWeekly ? opts.updateWeekly : false;
  }
  if(ofd > 0){
    $("#totalOFD").text(ofd);
  }else if(!stopReportPull && updateWeekly){
    console.log("now will be a good time to log a weekly report");
    $("#totalOFD").html('<span class="spinner-border spinner-border-sm" aria-hidden="true"></span> Updating WR, Please wait...');
    await updateWeeklyReport().then(function (result) {
      console.log(result);
      if(result.successfull){
        $("#totalOFD").html(result.msg);
        setTimeout(() => {
        $("#totalOFD").html(totalOFD);
        }, 5000);
      }else{
        if(result.error){
          $("#totalOFD").html(result.error);
        }else{
          $("#totalOFD").html(result.msg);
          setTimeout(() => {
          $("#totalOFD").html(totalOFD);
          }, 5000);
        }
      }
    }).catch(err => {
      $("#totalOFD").html();
          setTimeout(() => {
          $("#totalOFD").html(totalOFD);
          }, 5000);
          console.log(err);
    });
  }else{
    $("#totalOFD").text(ofd);
    console.log("cant save WR, pull was stopped abrubptley");
  }
}




/* *********************  WEEKLY REPORT ************************** */

async function processWeeklyReport(date){
  let weekDates = await getWeekDates(new Date(date));
  let body = {driverNumber:driverNumber, startDate: weekDates[0], endDate:weekDates[6]};
  let contractors = await getContractorsList();
  for await (const contractor of contractors){


    $.post(domain + '/getDriverWeekReport' ,body, async function (report) {
      if(report.length > 0){
        console.log('Processing Weekly Report for:', driverName);
        // console.log(drivers);
        
        let driverWeekReport = await displayWeeklyReport(drivers, {dateTime:dateTime});
        drivers = updatedDrivers.drivers;
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
}


async function pullWeeklyReport() {
  stopReportPull = false;
  $("#pullWeeklyButton").addClass("disabled");
  $("#pullWeeklyButton").html('<span class="spinner-border spinner-border-sm" aria-hidden="true"></span><span id="" role="status"> <span id="weekly-report-process-status" role="status">Loading...</span></span>');
  let selectedWeekDate = $('#weekSelect').val();
  let date = new Date(selectedWeekDate).getTime();
  $.get(domain + '/getWeeklyReport/'+date, async function (report) {
    if(report.drivers.length > 0){
      console.log('Processing Weekly Report');
      console.log(report);
      totalDrivers = await report.drivers.length;
      let result = await displayWeeklyReport(report);
      $("#pullWeeklyButton").removeClass("disabled");
      $("#pullWeeklyButton").html('Pull Weekly Report');
      $('#sync-warning').addClass("d-none");
    }else{
      console.log("No Weekly Report Found at the Moment");
      $('#weeklyReportMsg').text("Hmm.... it looks No Weekly report has been compiled.");
      $('#weeklyReportMsg').removeClass("d-none");
        $("#pullWeeklyButton").removeClass("disabled");
      $("#pullWeeklyButton").html('Pull Report');
    }
  })
}


//display Weekly REport from database
async function displayWeeklyReport(wr){
    driverCount = 0;
    clientWeeklyStatus = [];
    $('#weeklyReportDetails tbody').html('');
    for await (const driver of wr.drivers){
      driverCount ++;
      updateWeeklyLoadStatus(Math.trunc((driverCount/wr.drivers.length)/100));
      let totalDelivered = 0;
      
      let textWarningColor = 'text-secondary'
      let html = "<tr class='table-bordered'>";
      
      html += '<td>'+driver.driverNumber+'</td>';
      html += '<td> <a class="btn p-0 m-0" driverNumber="'+driver.driverName+'" >'+ driver.driverName +'</a></td>';
      
      targetDate = await getDateOfSpecificDay(wr.startDate, 6);
      // console.log("Sat - day 6", targetDate);
      totalDelivered += driver.saturday.delivered;
      alliasLower = (driver.saturday.driverAllias ? driver.saturday.driverAllias.toLowerCase() : "").split(" ");
      driverNameLower = driver.driverName.toLowerCase().split(" ");
      alliasMatch = driverNameLower.some(item => alliasLower.includes(item));
      html += '<td> <a class="btn p-0 m-0 '+(alliasMatch ? "":textWarningColor)+'" reportDay="saturday" driverNumber="'+driver.driverNumber+'"  reportDate="'+targetDate+'" '+(driver.saturday.delivered ? ' onclick="showDelieveredStops(this)"' : '')+ '>'+ driver.saturday.delivered +'</a></td>';

      targetDate = await getDateOfSpecificDay(wr.startDate, 0);
      // console.log("Sun - day 0", targetDate);
      totalDelivered += driver.sunday.delivered;
      alliasLower = (driver.sunday.driverAllias ? driver.sunday.driverAllias.toLowerCase() : "").split(" ");
      driverNameLower = driver.driverName.toLowerCase().split(" ");
      alliasMatch = driverNameLower.some(item => alliasLower.includes(item));
      html += '<td> <a class="btn p-0 m-0 '+(alliasMatch ? "":textWarningColor)+'" reportDay="sunday" driverNumber="'+driver.driverNumber+'"  reportDate="'+targetDate+'" '+(driver.sunday.delivered ? ' onclick="showDelieveredStops(this)"' : '')+ '>'+ driver.sunday.delivered +'</a></td>';

      targetDate = await getDateOfSpecificDay(wr.startDate, 1);
      // console.log("mon - day 1", targetDate);
      totalDelivered += driver.monday.delivered;
      alliasLower = (driver.monday.driverAllias ? driver.monday.driverAllias.toLowerCase() : "").split(" ");
      driverNameLower = driver.driverName.toLowerCase().split(" ");
      alliasMatch = driverNameLower.some(item => alliasLower.includes(item));
      html += '<td> <a class="btn p-0 m-0 '+(alliasMatch ? "":textWarningColor)+'" reportDay="monday" driverNumber="'+driver.driverNumber+'"  reportDate="'+targetDate+'" '+(driver.monday.delivered ? ' onclick="showDelieveredStops(this)"' : '')+ '>'+ driver.monday.delivered +'</a></td>';

      targetDate = await getDateOfSpecificDay(wr.startDate, 2);
      // console.log("tue - day 2", targetDate);
      totalDelivered += driver.tuesday.delivered;
      alliasLower = (driver.tuesday.driverAllias ? driver.tuesday.driverAllias.toLowerCase() : "").split(" ");
      driverNameLower = driver.driverName.toLowerCase().split(" ");
      alliasMatch = driverNameLower.some(item => alliasLower.includes(item));
      html += '<td> <a class="btn p-0 m-0 '+(alliasMatch ? "":textWarningColor)+'" reportDay="saturday" driverNumber="'+driver.driverNumber+'"  reportDate="'+targetDate+'" '+(driver.tuesday.delivered ? ' onclick="showDelieveredStops(this)"' : '')+ '>'+ driver.tuesday.delivered +'</a></td>';

      targetDate = await getDateOfSpecificDay(wr.startDate, 3);
      // console.log("wed - day 3", targetDate);
      totalDelivered += driver.wednesday.delivered;
      alliasLower = (driver.wednesday.driverAllias ? driver.wednesday.driverAllias.toLowerCase() : "").split(" ");
      driverNameLower = driver.driverName.toLowerCase().split(" ");
      alliasMatch = driverNameLower.some(item => alliasLower.includes(item));
      html += '<td> <a class="btn p-0 m-0 '+(alliasMatch ? "":textWarningColor)+'" reportDay="saturday" driverNumber="'+driver.driverNumber+'"  reportDate="'+targetDate+'" '+(driver.wednesday.delivered ? ' onclick="showDelieveredStops(this)"' : '')+ '>'+ driver.wednesday.delivered +'</a></td>';

      targetDate = await getDateOfSpecificDay(wr.startDate, 4);
      // console.log("thu - day 4", targetDate);
      totalDelivered += driver.thursday.delivered;
      alliasLower = (driver.thursday.driverAllias ? driver.thursday.driverAllias.toLowerCase() : "").split(" ");
      driverNameLower = driver.driverName.toLowerCase().split(" ");
      alliasMatch = driverNameLower.some(item => alliasLower.includes(item));
      html += '<td> <a class="btn p-0 m-0 '+(alliasMatch ? "":textWarningColor)+'" reportDay="saturday" driverNumber="'+driver.driverNumber+'"  reportDate="'+targetDate+'" '+(driver.thursday.delivered ? ' onclick="showDelieveredStops(this)"' : '')+ '>'+ driver.thursday.delivered +'</a></td>';

      targetDate = await getDateOfSpecificDay(wr.startDate, 5);
      // console.log("fri - day 5", targetDate);
      totalDelivered += driver.friday.delivered;
      alliasLower = (driver.friday.driverAllias ? driver.friday.driverAllias.toLowerCase() : "").split(" ");
      driverNameLower = driver.driverName.toLowerCase().split(" ");
      alliasMatch = driverNameLower.some(item => alliasLower.includes(item));
      html += '<td> <a class="btn p-0 m-0 '+(alliasMatch ? "": textWarningColor)+'" reportDay="saturday" driverNumber="'+driver.driverNumber+'"  reportDate="'+targetDate+'" '+(driver.friday.delivered ? ' onclick="showDelieveredStops(this)"' : '')+ '>'+ driver.friday.delivered +'</a></td>';


      html += '<td>'+totalDelivered+'</td>';
      html+="</tr>";
     
      if(driverCount >= wr.drivers.length){
        $('#weeklyReportDriverPlaceHolder').addClass('d-none');
      }
      $('#weeklyReportDetails tbody').append(html);
      html="";
      // let newDriver = driver;
      driver['total'] = totalDelivered;
      driver['startDate'] = wr.startDate;
      clientWeeklyStatus.push(driver);
    }
}


async function displayWeeklyReportWithClientStauts(driverStatus){
  $('#weeklyReportDetails tbody').html("")
  $('#weeklyReportDriverPlaceHolder').removeClass('d-none');

  for await (const driver of driverStatus){
    // driverCount ++;
    // updateWeeklyLoadStatus(Math.trunc((driverCount/wr.drivers.length)/100));
      let totalDelivered = 0;
      
      let textWarningColor = 'text-secondary'
      let html = "<tr class='table-bordered'>";
      
      html += '<td>'+driver.driverNumber+'</td>';
      html += '<td> <a class="btn p-0 m-0" driverNumber="'+driver.driverName+'" >'+ driver.driverName +'</a></td>';
      
      targetDate = await getDateOfSpecificDay(driver.startDate, 6);
      // console.log("Sat - day 6", targetDate);
      totalDelivered += driver.saturday.delivered;
      alliasLower = (driver.saturday.driverAllias ? driver.saturday.driverAllias.toLowerCase() : "").split(" ");
      driverNameLower = driver.driverName.toLowerCase().split(" ");
      alliasMatch = driverNameLower.some(item => alliasLower.includes(item));
      html += '<td> <a class="btn p-0 m-0 '+(alliasMatch ? "":textWarningColor)+'" reportDay="saturday" driverNumber="'+driver.driverNumber+'"  reportDate="'+targetDate+'" '+(driver.saturday.delivered ? ' onclick="showDelieveredStops(this)"' : '')+ '>'+ driver.saturday.delivered +'</a></td>';

      targetDate = await getDateOfSpecificDay(driver.startDate, 0);
      // console.log("Sun - day 0", targetDate);
      totalDelivered += driver.sunday.delivered;
      alliasLower = (driver.sunday.driverAllias ? driver.sunday.driverAllias.toLowerCase() : "").split(" ");
      driverNameLower = driver.driverName.toLowerCase().split(" ");
      alliasMatch = driverNameLower.some(item => alliasLower.includes(item));
      html += '<td> <a class="btn p-0 m-0 '+(alliasMatch ? "":textWarningColor)+'" reportDay="sunday" driverNumber="'+driver.driverNumber+'"  reportDate="'+targetDate+'" '+(driver.sunday.delivered ? ' onclick="showDelieveredStops(this)"' : '')+ '>'+ driver.sunday.delivered +'</a></td>';

      targetDate = await getDateOfSpecificDay(driver.startDate, 1);
      // console.log("mon - day 1", targetDate);
      totalDelivered += driver.monday.delivered;
      alliasLower = (driver.monday.driverAllias ? driver.monday.driverAllias.toLowerCase() : "").split(" ");
      driverNameLower = driver.driverName.toLowerCase().split(" ");
      alliasMatch = driverNameLower.some(item => alliasLower.includes(item));
      html += '<td> <a class="btn p-0 m-0 '+(alliasMatch ? "":textWarningColor)+'" reportDay="monday" driverNumber="'+driver.driverNumber+'"  reportDate="'+targetDate+'" '+(driver.monday.delivered ? ' onclick="showDelieveredStops(this)"' : '')+ '>'+ driver.monday.delivered +'</a></td>';

      targetDate = await getDateOfSpecificDay(driver.startDate, 2);
      // console.log("tue - day 2", targetDate);
      totalDelivered += driver.tuesday.delivered;
      alliasLower = (driver.tuesday.driverAllias ? driver.tuesday.driverAllias.toLowerCase() : "").split(" ");
      driverNameLower = driver.driverName.toLowerCase().split(" ");
      alliasMatch = driverNameLower.some(item => alliasLower.includes(item));
      html += '<td> <a class="btn p-0 m-0 '+(alliasMatch ? "":textWarningColor)+'" reportDay="saturday" driverNumber="'+driver.driverNumber+'"  reportDate="'+targetDate+'" '+(driver.tuesday.delivered ? ' onclick="showDelieveredStops(this)"' : '')+ '>'+ driver.tuesday.delivered +'</a></td>';

      targetDate = await getDateOfSpecificDay(driver.startDate, 3);
      // console.log("wed - day 3", targetDate);
      totalDelivered += driver.wednesday.delivered;
      alliasLower = (driver.wednesday.driverAllias ? driver.wednesday.driverAllias.toLowerCase() : "").split(" ");
      driverNameLower = driver.driverName.toLowerCase().split(" ");
      alliasMatch = driverNameLower.some(item => alliasLower.includes(item));
      html += '<td> <a class="btn p-0 m-0 '+(alliasMatch ? "":textWarningColor)+'" reportDay="saturday" driverNumber="'+driver.driverNumber+'"  reportDate="'+targetDate+'" '+(driver.wednesday.delivered ? ' onclick="showDelieveredStops(this)"' : '')+ '>'+ driver.wednesday.delivered +'</a></td>';

      targetDate = await getDateOfSpecificDay(driver.startDate, 4);
      // console.log("thu - day 4", targetDate);
      totalDelivered += driver.thursday.delivered;
      alliasLower = (driver.thursday.driverAllias ? driver.thursday.driverAllias.toLowerCase() : "").split(" ");
      driverNameLower = driver.driverName.toLowerCase().split(" ");
      alliasMatch = driverNameLower.some(item => alliasLower.includes(item));
      html += '<td> <a class="btn p-0 m-0 '+(alliasMatch ? "":textWarningColor)+'" reportDay="saturday" driverNumber="'+driver.driverNumber+'"  reportDate="'+targetDate+'" '+(driver.thursday.delivered ? ' onclick="showDelieveredStops(this)"' : '')+ '>'+ driver.thursday.delivered +'</a></td>';

      targetDate = await getDateOfSpecificDay(driver.startDate, 5);
      // console.log("fri - day 5", targetDate);
      totalDelivered += driver.friday.delivered;
      alliasLower = (driver.friday.driverAllias ? driver.friday.driverAllias.toLowerCase() : "").split(" ");
      driverNameLower = driver.driverName.toLowerCase().split(" ");
      alliasMatch = driverNameLower.some(item => alliasLower.includes(item));
      html += '<td> <a class="btn p-0 m-0 '+(alliasMatch ? "": textWarningColor)+'" reportDay="saturday" driverNumber="'+driver.driverNumber+'"  reportDate="'+targetDate+'" '+(driver.friday.delivered ? ' onclick="showDelieveredStops(this)"' : '')+ '>'+ driver.friday.delivered +'</a></td>';


      html += '<td>'+totalDelivered+'</td>';
      html+="</tr>";
     
      // if(driverCount >= wr.drivers.length){
      //   $('#weeklyReportDriverPlaceHolder').addClass('d-none');
      // }
      $('#weeklyReportDetails tbody').append(html);
      html="";
      // let newDriver = driver;
      // driver['total'] = totalDelivered;
      // clientWeeklyStatus.push(driver);
    }
}


async function showDelieveredStops(evt){
  $('#weeklyReportDetailModalTable thead').show();
  $('#weeklyReportDetailModalTable tbody').html("");
  date = new Date($(evt).attr("reportDate"));
  driverNumber = Number($(evt).attr("driverNumber"));
  let driverName = driverNumber;
  let delNumber = 0;
  
  let driverSearchResult = (await getSingleDriverReport(driverNumber, date.getTime()));
  if(driverSearchResult.successfull){

  
    let driver = driverSearchResult.driver;
    
    let deliveredStops = await getDeliveredStops(driver.manifest);
    
    if(deliveredStops.length){
      delNumber = deliveredStops.length;
      driverName = driver.driverName + ' <small><i class="opacity-50">('+driver.driverAllias+') - '+delNumber+'</i></small>';

      for await (const stop of deliveredStops){
        let html = '<tr class="table-bordered">';
        let barcodeColor = (await (isPriority(stop))) ? "link-danger" : "link-secondary";  
        html += '<td> <a class="'+barcodeColor+' link-offset-2" href="https://triumphcourier.com/barcodetool/track/'+(stop.barcode)+'" target="_blank">'+(stop.barcode)+' <i class="bi bi-search"></i></a></td>';
        html += '<td> '+ stop.brand +'</td>';
        html += '<td> '+ stop.name +'</td>';
        html += '<td>'+ stop.street +'</td>';
        html += '<td> '+ stop.city +'</td>';
        html += '<td> '+ stop.state +'</td>';
        html += '<td> '+ ((stop.Events? stop.Events[0].Status : null) ?? stop.lastScan) + '</td>';
        html += '<td>'+ (new Date((stop.Events? stop.Events[0].UtcEventDateTime : false) ?? null)?.toLocaleString()) + '</td>';
        html += "</tr>";
        $('#weeklyReportDetailModalTable tbody').append(html);
      }
    }else{
      let html = '<tr class="table-bordered"> <td colspan="8"> Nothing to see here </td> </tr>';
      $('#weeklyReportDetailModalTable tbody').html(html);
    }
  }else{
    let html = '<tr class="table-bordered"> <td colspan="8"> Failed to Fetch Driver </td> </tr>';
     $('#weeklyReportDetailModalTable tbody').html(html);
  }

  $("#weeklyReportDetailsHeader").html(date.toLocaleDateString() +" : " + driverName);
  
  const deliveredDetailed = new bootstrap.Modal('#weeklyReportDetailModal', {
    keyboard: true
  })
  deliveredDetailed.show();
}


//updateWeeklyReport() saves the days finalized delivered# to an already existing WR or creates one if other.
async function updateWeeklyReport(){
  drivers = [];
  startDate = (await getWeekDates(clientDeiverStatus[0].date))[0];
  day = dayNames[new Date(clientDeiverStatus[0].date).getDay()];
  console.log("startDate for update is: ", startDate, " - ", day);
  for await (const driver of clientDeiverStatus){
    drivers.push({
      driverNumber:driver.driverNumber, 
      driverName:driver.driverName,
      driverAllias:driver.driverAllias, 
      delivered:driver.manifest.del.length,
      date:driver.date,
    });
  }

  if(drivers.length){
    let response = await $.post(domain + "/updateWeeklyReport", {drivers:drivers, day:day, startDate:startDate});
    if(response){
      console.log(response);
      return response;
    }else{
      console.log("potentially failed");
      console.log(response);
      return response;
    }
  }else{
    log("driver compiation for WR failed");
    return({successfull:false, msg: "driver compiation for WR failed"});
  }
}

function extractPastManifest(){
  console.log("selected Date to extract: ", selectedReportDateTime);
  extractMail({extractDateTime:selectedReportDateTime});
}


async function extractMail(opts){
  selectedExtractionDateTime = 0;
  if(opts){
    if (opts.extractDateTime){
      selectedExtractionDateTime = opts.extractDateTime ? (new Date(Number(opts.extractDateTime)).setHours(0,0,0,0)) : 0; 
    }
  }

  $("#extractMailButton").addClass("disabled");
  $("#extractPastManifestButton").addClass("disabled");
  $("#pullRequestButton").addClass("disabled");
  $("#pullRequestButton").html('<span class="spinner-border spinner-border-sm" aria-hidden="true"></span><span id="" role="status"> <span id="report-process-status" role="status">Extracting Mails...</span></span>');
  //********* activate modal here */
  $('#infoDialogTittle').text('Extraction Status')
  $('#infoDialogDetails').html('<div class="spinner-grow" role="status"><span class="visually-hidden">Loading...</span></div>')
   const infoDialog = new bootstrap.Modal('#infoDialog', {
    keyboard: true
  })
  infoDialog.show();

  try {
        await $.get(EXTRACTINGURL+selectedExtractionDateTime, function (response) {
          if(response?.successfull){
            $('#infoDialogDetails').html('<p>Extraction Succesfull. </p> <p>Total Drivers: '+response.driverCount+'</p>');
            if(response.errors){
              $('#infoDialogDetails').append('<b>Errors</b>')
              response.errors.forEach(element => {
                $('#infoDialogDetails').append('<p>Sender: '+element?.sender+' | Msg: '+element?.message+'</p>')
              });
              $('#infoDialogDetails').append('<p> <a class="btn btn-outline-accent" onclick="refreshPage()"> Reload <i class="bi bi-arrow-clockwise"></i></a></p>');
            }
            console.log("EXTRACTION COMPLETED");
            $("#totalOFD").html("Extraction Completed. Total Drivers:."+ response.driverCount);
              setTimeout(() => {
                $("#totalOFD").html(totalOFD);
              }, 7000);
            console.log(response);
          }else{
            console.log("EXTRACTION FAILED");
            $("#totalOFD").html("Extraction Failed: " + response.message);
              setTimeout(() => {
                $("#totalOFD").html(totalOFD);
              }, 7000);
            console.log(response);
            
            if(response.err === "EXTRACTION_IN_PROGRESS"){
              $('#infoDialogDetails').html('<p>Extraction Request Bounced. </p>');
              $('#infoDialogDetails').append('<p>'+response?.message+'</p>');
              // $('#infoDialogDetails').append('<p> <a onclick="refreshPage()"> Reload <i class="bi bi-arrow-clockwise"></i></a></p>');
            }else if(response.message === "No Emails Sent"){
              $('#infoDialogDetails').html('<p>No Emails Found for todays Extraction. </p>');
              $('#infoDialogDetails').append('<p>'+response?.message+'</p>');
              // $('#infoDialogDetails').append('<p> <a onclick="refreshPage()"> Reload <i class="bi bi-arrow-clockwise"></i></a></p>');
            }else{
              $('#infoDialogDetails').html('<p>Manifest is Still being extreacted, refresh the page in about 2 mins. </p>');
              $('#infoDialogDetails').append('<p>'+response?.message+'</p>');
            }
          }
        })   
  }catch (error) {
    console.log("Encountered an Error Extracting mails");
    console.log(error);
    console.log(error.status);
    if(error.status == 0){
      $('#infoDialogDetails').html('<p>Extraction is taking a little longer but is In Progress. </p>');
      $('#infoDialogDetails').append('<p> Continue to hold on and click "Check Status" in another 2 mins</p>');
      $('#infoDialogDetails').append('<p> <a class="button" onclick="checkAndUpdateExtractionStatus()"> Check Status <i class="bi bi-arrow-clockwise"></i></a></p>');
    }else{
      $('#infoDialogDetails').html('<p>Encountered the folllowing error(s). </p>');
      $('#infoDialogDetails').append('<p> '+ JSON.stringify(error) +'</p>');
      
    }
  
    
  }
  $("#pullRequestButton").removeClass("disabled");
  $("#extractMailButton").removeClass("disabled");
  $("#extractPastManifestButton").removeClass("disabled");
  $("#pullRequestButton").html('Pull Report');
}


async function deleteDR(){
  console.log("selected Date to Delete: ", selectedReportDateTime);
  const enteredPassword = await prompt('Enter SuperAdmin Password:');
  console.log(enteredPassword);
  deleteReport({deleteDateTime:selectedReportDateTime, password:enteredPassword});
}

async function checkAndUpdateExtractionStatus(){
  try {
    await $.get(domain + "/checkExtractionStatus/:0", function(done) {
      if(!done){
          $('#infoDialogDetails').html('<p>Extraction is In Progress. </p>');
          $('#infoDialogDetails').append('<p> Continue to hold on and click "Check Status" in another 2mins</p>');
          $('#infoDialogDetails').append('<p> <a class="button" onclick="checkAndUpdateExtractionStatus()"> Check Status <i class="bi bi-arrow-clockwise"></i></a></p>');
      }else{
        $('#infoDialogDetails').html('<p>Extraction Completed</p>');
        $('#infoDialogDetails').append('<p> Click the button below to reload the updated offline report</b></p>');
        $('#infoDialogDetails').append('<p> <a class="btn btn-accent" onclick="pullLocalReport()"> Display Updated Report <i class="bi bi-arrow-clockwise"></i></a></p>');
      }
    });
  } catch (error) {
        $('#infoDialogDetails').html('<p>Encountered an error checking extraction status</p>');
        $('#infoDialogDetails').append('<p>Close this dialog and try Extracting again</p>');
        // $('#infoDialogDetails').append('<p> <a class="button" onclick="checkAndUpdateExtractionStatus()"> Check Status <i class="bi bi-arrow-clockwise"></i></a></p>');  
  }
}


async function deleteReport(opts){
  selectedExtractionDateTime = 0;
  password = "null";
  if(opts){
    if (opts.deleteDateTime){
      selectedExtractionDateTime = opts.deleteDateTime ? new Date(Number(opts.deleteDateTime)).setHours(0,0,0,0) : selectedReportDateTime; 
    }
    if (opts.password){
      password = opts.password ? opts.password : "null"; 
    }
  }
  console.log("final date to be delted: ", selectedExtractionDateTime , " : ", new Date(selectedExtractionDateTime));
  $("#deleteReportButton").addClass("disabled");
  $("#pullRequestButton").addClass("disabled");
  $("#pullRequestButton").html('<span class="spinner-border spinner-border-sm" aria-hidden="true"></span><span id="" role="status"> <span id="report-process-status" role="status">Deleting Report...</span></span>');
  try {
    await $.get(domain + "/deleteDriverReport/"+selectedExtractionDateTime+"/"+password+"", function (response) {
      if(response?.successfull){
        console.log(response);
        console.log("DELETION COMPLETED");
        if(response.deletedCount > 0){
          $("#totalOFD").html("Deletion Completed. Total Records Deleted:."+ response.deletedCount);
          setTimeout(() => {
            $("#totalOFD").html(totalOFD);
          }, 7000);
          console.log(response);
        }else{
          $("#totalOFD").html("Operation successful: No Records were Deleted.");
          setTimeout(() => {
            $("#totalOFD").html(totalOFD);
          }, 7000);
          console.log(response);
        }
        
      }else{
        console.log("DELETION FAILED");
        $("#totalOFD").html("Deletion Failed: " + response.message);
          setTimeout(() => {
            $("#totalOFD").html(totalOFD);
          }, 7000);
        console.log(response);
      }
    })
  } catch (error) {
    console.log("Encountered an Error Deleting REports");
    console.log(error);
    console.log(error.status);
    if(error.status == 0){
      $("#totalOFD").html("Email Extraction Server isnt running. Try again after starting it.");
          setTimeout(() => {
          $("#totalOFD").html(totalOFD);
      }, 7000);
    }else if(error.status == 200){
      $("#totalOFD").html("Deletion Completed with possible errors.");
          setTimeout(() => {
          $("#totalOFD").html(totalOFD);
      }, 7000);
    }
    
  }
  $("#pullRequestButton").removeClass("disabled");
  $("#deleteReportButton").removeClass("disabled");
  $("#pullRequestButton").html('Pull Report');
}

async function getWeekDates(randomDate) {
  let date = randomDate ?? new Date();
  const weekDates = [];
  const currentDate = new Date(date);

  // Find the first day (Sunday) of the week for the given date
  if(currentDate.getDay() !== 6){
    currentDate.setDate(currentDate.getDate() - (currentDate.getDay() +1));  
  }
  
  // Subtract 7 days to go back to the first day of the previous week
  // currentDate.setDate(currentDate.getDate() - 7);


  // Iterate through the days of the week and push them to the weekDates array
  for (let i = 0; i < 7; i++) {
    const day = new Date(currentDate);
    day.setDate(currentDate.getDate() + i);
    weekDates.push(day);
  }

  return weekDates;
}

function selectDate(evt){
  dateButton = $(evt);
  dateButtonChild = dateButton.children("div");
  $(".dateButton").removeClass("border-accent").addClass("border");
  $(".today").removeClass("border")
  dateButtonChild.addClass("border-accent").removeClass("border");
  selectedReportDateTime = Number(dateButton.attr("value"));
  // console.log(selectedReportDateTime);
  // console.log("Selected Date:", new Date(selectedReportDateTime));
} 

async function prepareWeeklyReportInterface(){
  $("#weeklyReportMsg").show();
  await setAvailableWeeks();
  await stagePulling();
  if(sideBarMenu.hasClass("show")){
    sideBarMenu.toggleClass("show")
  }
}

async function prepareDeliveryReportInterface() {
  if(sideBarMenu.hasClass("show")){
    sideBarMenu.toggleClass("show")
  }
}

async function prepareMLSReportnterface(){
  let mlsTotal = 0;
  $("#pullMLSReportButton").addClass("disabled");
  $("#pullMLSReportButton").html('<span class="spinner-border spinner-border-sm" aria-hidden="true"></span><span id="" role="status"> <span id="mls-process-status" role="status">Preping MLS Report...</span></span>');
  $('#mlsReportBody').empty();
  if(clientDeiverStatus.length){
    for await(driver of clientDeiverStatus){
      stopArray = [...driver.manifest.pmls,...driver.manifest.mls,...driver.manifest.problemStops];
      mlsTotal += stopArray.length;
      $("#mls-total").text(" | "+mlsTotal);
      if(stopArray.length){
        let tableID = driver.driverNumber+'-mlsDetails';
        let driverCollapseID = driver.driverNumber+'-collapse';
        let htmlStart = '<div class="accordion-item">'
                        +'<h2 class="accordion-header bg-secondary bg-opacity-25 text-dark">'
                        +'<button class="accordion-button bg-secondary bg-opacity-10 text-dark" type="button" data-bs-toggle="collapse" data-bs-target="#'+driverCollapseID+'"'
                        + ' >'
                        + driver.driverNumber + ' - <b> &nbsp;' + driver.driverName + ' - ' + stopArray.length + '</b>'
                        +'</button>'
                        +'</h2>'
                        +'<div id="'+driverCollapseID+'" class="accordion-collapse collapse" data-bs-parent="#accordionExample">'
                        +'<div class="accordion-body">';
                    
        let tableHead = '<div class="table-responsive">'
            +'<table id="'+tableID+'" class="table table-hover">'
            +'<thead>'
            +'<tr>'
            +'<td><span class=" " data="barcode" >BARCODE</span></td>'
            +'<td><span class=" " data="brand" >BRAND</span></td>'
            +'<td><span class=" " data="name" >NAME</span></td>'
            +'<td><span class=" " data="street" >STREET</span></td>'
            +'<td><span class=" " data="city" >CITY</span></td>'
            +'<td><span class=" " data="state" >STATE</span></td>'
            +'<td><span class=" " data="status" >STATUS</span></td>'
            +'<td><span class=" " data="event" >LAST EVENT</span></td>'
            +'</tr>'
            +'</thead>'
            +'<tbody >';

        let tableFoot = '</tbody> </table> </div>'
        let htmlEnd = '</div> </div> </div>';
        let html = htmlStart + tableHead + tableFoot + htmlEnd;
        $('#mlsReportBody').append(html);

        let tableBody = "";

        for await (const stop of stopArray){
          let stopAddress = stop.brand + " - " + stop.street + " " + stop.city
          let tableBody = '<tr class="table-bordered">';
          let barcodeColor = (await (isPriority(stop))) ? "link-danger" : "link-secondary";  
          tableBody += '<td> <a class="'+barcodeColor+' link-offset-2" href="https://triumphcourier.com/barcodetool/track/'+(stop.barcode)+'" target="_blank">'+(stop.barcode)+' <i class="bi bi-search"></i></a></td>';
          tableBody += '<td> '+ stop.brand +'</td>';
          tableBody += '<td> '+ stop.name +'</td>';
          tableBody += '<td>'+ stop.street +'</td>';
          tableBody += '<td> '+ stop.city +'</td>';
          tableBody += '<td> '+ stop.state +'</td>';
          tableBody += '<td> <span onclick="displayConfirmationDialog(this)" driverID="'+driver._id+'" barcode="'+stop.barcode+'" stopAddress="'+stopAddress+'"  class="btn btn-sm btn-outline-accent">'+ ((stop.Events? stop.Events[0].Status : null) ?? stop.lastScan) + '</span> </td>';
          tableBody += '<td>'+ (new Date((stop.Events? stop.Events[0].UtcEventDateTime : false) ?? driver.date).toLocaleString()) + '</td>';
          tableBody += "</tr>";
          $('#'+tableID+' tbody').append(tableBody);
        }    
      }
    }
  }else{
    $('#mlsReportBody').html('<div class="text-center container"> Driver Updates Aren\'t available at the moment. Click <b class="text-accent" > Load MLS Report </b> to attempt reloading the report. if you still see this message then check the <b class="text-accent" > Delivery Report </b> page to ensure that driver manifests has been ectracted from email. </div>');  
  }
  $("#pullMLSReportButton").removeClass("disabled");
  $("#pullMLSReportButton").html('Load MLS Report');
  if(sideBarMenu.hasClass("show")){
    sideBarMenu.toggleClass("show")
  }
}


function displayConfirmationDialog(evt){
  $("#switchLoadButton").removeClass("disabled")
  $('#addToLoadDialog .modal-body .container-fluid').html('<div class="row row-cols-4 g-2 align-items-center calendar" id="confirmDetails"></div>')
  let event  = $(evt);
  let driverID = event.attr("driverID");
  let barcode = event.attr("barcode");
  let stopAddress = event.attr("stopAddress");
  $("#confirmDetails").html(stopAddress)
  $("#mlsLoadFormDriverID").val(driverID)
  $("#mlsLoadFormBarcode").val(barcode)
   const addToLoadDialog = new bootstrap.Modal('#addToLoadDialog', {
    keyboard: true
  })
  addToLoadDialog.show();
}

async function switchLoad(){
  let mlsLoadForm = $("#mlsLoadForm").serializeArray();
  let body = $('#addToLoadDialog .modal-body .container-fluid');
  let oldHtml = body.html();
  body.html('<div class="spinner-border" role="status"> <span class="visually-hidden">Loading...</span> </div>');
  $("#switchLoadButton").addClass("disabled")
  $.post(domain + '/switchLoadStatus', {documentID:mlsLoadForm[0].value, barcode:mlsLoadForm[1].value}, 
    async function(result) {
      if(result.successfull){
        body.html('<span class="text-success"> Updated Load Status Successfully</>')
        driverIndex = clientDeiverStatus.findIndex(d => d._id == mlsLoadForm[0].value);
        console.log(driverIndex);
        stopIndex = clientDeiverStatus[driverIndex].manifest.mls.findIndex(s => s.barcode == mlsLoadForm[1].value);
        console.log(driverIndex, "  --  " , stopIndex);
        
        clientDeiverStatus[driverIndex].manifest.mls[stopIndex].lastScan === "Loaded";
        

        let removedItem = clientDeiverStatus[driverIndex].manifest.mls.splice(stopIndex, 1)[0];
        clientDeiverStatus[driverIndex].manifest.ofd.push(removedItem);

        // let combinedStopArray = clientDeiverStatus.manifest.map(obj => obj.values).reduce((acc, val) => acc.concat(val), []);
        // clientDeiverStatus.manifest = combinedStopArray;

        // displayReport(clientDeiverStatus, {updateWeekly:false} );
        prepareMLSReportnterface();
      }else{
        $("#switchLoadButton").removeClass("disabled")
        body.html('<span class="text-danger"> Failed to Update Load Status : ' + result.err+'</>')
      }
    }).fail(function(error) {
      $("#switchLoadButton").removeClass("disabled")
      body.html('<span class="text-danger"> Connection Failed !</>')
    });

}

async function getDateOfSpecificDay(startDate, dayOfWeek) {
  const today = new Date(new Date(startDate).getTime());
  const currentDayOfWeek = today.getDay(); // 0 for Sunday, 1 for Monday, and so on.
  const daysUntilTargetDay = (dayOfWeek - currentDayOfWeek + 7) % 7;

  today.setDate(today.getDate() + daysUntilTargetDay);
  return today;
}


function getPastDates() {
  // Get the current date
  const currentDate = new Date();
  currentDate.setHours(0,0,0,0)
  // Create an array to store the past thirty dates
  const pastDates = [];

  // Loop through the past thirty days and add them to the array
  for (let i = 29; i >= 0; i--) {
    const pastDate = new Date(currentDate);
    pastDate.setDate(currentDate.getDate() - i);
    pastDates.push(pastDate);
  }

  return pastDates;
}

function compareDates(t, d) {
  let comparison = 0;
  if (t.getFullYear() > d.getFullYear()) {
    comparison = 1;
  } else if (t.getFullYear() < d.getFullYear()) {
    comparison = -1;
  } else if (t.getFullYear() === d.getFullYear()) {
    if (t.getMonth() > d.getMonth()) {
      comparison = 1;
    } else if (t.getMonth() < d.getMonth()) {
      comparison = -1;
    } else if (t.getMonth() == d.getMonth()) {
      if (t.getDate() > d.getDate()) {
        comparison = 1;
      } else if (t.getDate() < d.getDate()) {
        comparison = -1;
      }
    }
  }
  return comparison;
}

function refreshPage(){
  location.reload();
}

// Function to convert string to sentence case
function toSentenceCase(sentence) {
    return sentence.toLowerCase().replace(/(^\s*\w|[\.\!\?]\s*\w)/g, function(c) {
        return c.toUpperCase();
    });
}


async function setAvailableWeeks(){
    $.get(domain + '/getWeeklyReportRanges', async function (reportDates) {
      if(reportDates.length){
        await reportDates.reverse();
        $("#weekSelect").html('');
        for (const reportRange of reportDates){
          $("#weekSelect").append('<option date="' + reportRange._id + '" id="' + reportRange._id + ' onclick="stagePulling(this)">'+ new Date(reportRange._id).toLocaleString() +'</option>');
        }
      }else{
        console.log("no WeeklyReports found at the moment");
        $("#weeklyReportMsg").text("Hmmm...No Report avialable at the moment")
      }
    })
}

async function stagePulling(evt){
  $("#pullWeeklyButton").removeClass("disabled");
}

const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
