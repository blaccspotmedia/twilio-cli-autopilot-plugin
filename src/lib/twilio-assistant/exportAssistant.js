const files = require('../../lib/files');

const exportAssistant = async (assistantSid, twilioClient, recoverSchema = false) => {

    let sampleAssistant = {
      "friendlyName": "",
      "logQueries": true,
      "uniqueName": "",
      "defaults": {},
      "styleSheet": {},
      "fieldTypes": [],
      "tasks": [],
      "modelBuild" : {}
    };

    return await Promise.resolve()

      // fetch assistant info
      .then ( async () => {

          return twilioClient.autopilot
            .assistants(assistantSid)
            .fetch().then((assistant) => {

              return assistant;
            })
      })

      // fetch assistant defaults and stylesheet
      .then(async (assistant) => {

        //sampleAssistant.assistantSid = assistant.sid;
        sampleAssistant.friendlyName = assistant.friendlyName;
        sampleAssistant.uniqueName = assistant.uniqueName;

        // fetch assistant defaults
        await twilioClient.autopilot
          .assistants(assistant.uniqueName)
          .defaults()
          .fetch()
          .then((defaults) => {

            sampleAssistant.defaults = defaults.data;

          })

        // fetch assistant stylesheet
        await twilioClient.autopilot
          .assistants(assistant.uniqueName)
          .styleSheet()
          .fetch()
          .then((styleSheet) => {

            sampleAssistant.styleSheet = styleSheet.data;

          })

          return assistant;
      })

      // fetch assistant field types/values
      .then( async (assistant) => {

        // fetch assistant field types
        return await twilioClient.autopilot
        .assistants(assistant.uniqueName)
        .fieldTypes
        .list()
        .then( async (fieldTypes) => {

          let assistant_fieldTypes = [];

          if(fieldTypes.length){

            for( let i = 0 ; i < fieldTypes.length ; i++){

              let values = [];

              // fetch assistant field type values
              await twilioClient.autopilot
              .assistants(assistant.uniqueName)
              .fieldTypes(fieldTypes[i].uniqueName)
              .fieldValues
              .list()
              .then ( async (fieldValues) => {

                  if(fieldValues.length){

                    for( let j = 0 ; j < fieldValues.length ; j++){

                      values.unshift({
                        "language": fieldValues[j].language,
                        "value": fieldValues[j].value,
                        "synonymOf": fieldValues[j].synonymOf
                      })
                      if( j === fieldValues.length-1){

                        assistant_fieldTypes.push({
                          "uniqueName": fieldTypes[i].uniqueName,
                          "values": values
                        });

                      }
                    }
                  }
              })
                
              if(i === fieldTypes.length-1){

                sampleAssistant.fieldTypes = assistant_fieldTypes;
                return assistant;

              }
            }
          }
          else {

            sampleAssistant.fieldTypes = assistant_fieldTypes;
            return assistant;

          }

        })
      })

      // fetch assistant tasks
      .then(async (assistant) => {

        // fetch assistant tasks
        return await twilioClient.autopilot
        .assistants(assistant.uniqueName)
        .tasks
        .list()
        .then( async (tasks) => {

          let assistant_tasks = [];

          if(tasks.length){

            for( let i = 0 ; i < tasks.length ; i++){

              let actions = {}, task_samples = [], task_fields = [];

              // fetch assistant task actions
              await twilioClient.autopilot
              .assistants(assistant.uniqueName)
              .tasks(tasks[i].uniqueName)
              .taskActions
              .get()
              .fetch()
              .then(async (taskAction) => {
                
                actions = taskAction.data;
              })
              
              // fetch assistant task samples
              await twilioClient.autopilot
              .assistants(assistant.uniqueName)
              .tasks(tasks[i].uniqueName)
              .samples
              .list()
              .then ( async (samples) => {

                  for( let j = 0 ; j < samples.length ; j++){

                    task_samples.push({
                      "language": samples[j].language,
                      "taggedText": samples[j].taggedText
                    });
                  
                  }
              })

              // fetch assistant task field
              await twilioClient.autopilot
              .assistants(assistant.uniqueName)
              .tasks(tasks[i].uniqueName)
              .fields
              .list()
              .then ( async (fields) => {

                  for( let j = 0 ; j < fields.length ; j++){
                    
                    task_fields.push({
                      "uniqueName": fields[j].uniqueName,
                      "fieldType": fields[j].fieldType
                    })
                  
                  }
              })

              await assistant_tasks.push({
                "uniqueName": tasks[i].uniqueName,
                "actions": actions,
                "fields": task_fields,
                "samples": task_samples
              })

              if( i === tasks.length-1){

                  sampleAssistant.tasks = assistant_tasks;
                  return await assistant;

              }

            }

          }
          else{

            sampleAssistant.tasks = assistant_tasks;
            return await assistant;

          }

        })

      })

      // fetch assistant model builds
      .then( async (assistant) => {

          await twilioClient.autopilot
                .assistants(assistant.uniqueName)
                .modelBuilds
                .list()
                .then( async(model_build) =>{

                  if(model_build.length){

                    sampleAssistant.modelBuild = {
                        "uniqueName" : model_build[0].uniqueName
                    }
                  } 
                })

          const filename = await files.createAssistantJSONFile(assistant.uniqueName, recoverSchema);

          await files.writeAssistantJSONFile(sampleAssistant, filename, recoverSchema);

          assistant.filename = filename;
          
          return await assistant;
      })
      .catch((error) => {
        throw error;
      })
        
}

module.exports = { exportAssistant };