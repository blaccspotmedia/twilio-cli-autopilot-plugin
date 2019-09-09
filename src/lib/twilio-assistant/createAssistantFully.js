const fs = require('fs');

const createAssistantFully = async (schemaFile, twilioClient) => {

  if (!fs.existsSync(schemaFile)) {

    throw new Error(`The file ${schemaFile} was not be found.`)
  }

  const schema = require(schemaFile);

  if (!schema.hasOwnProperty('friendlyName') && !schema.hasOwnProperty('uniqueName')) {

    throw new Error(`A 'friendlyName' and/or 'uniqueName' must be defined in your schema.`)
  }

  let assistant_Obj = {
    friendlyName: schema.uniqueName,
    uniqueName: schema.uniqueName,
    logQueries: true,
  };

  if(schema.hasOwnProperty('defaults') && schema.defaults.hasOwnProperty('defaults'))
    assistant_Obj["defaults"] = schema.defaults;
  
  if(schema.hasOwnProperty('styleSheet') && schema.styleSheet.hasOwnProperty('style_sheet'))
    assistant_Obj["styleSheet"] = schema.styleSheet;

  return await Promise.resolve()

    
    
    //create new assistant
    .then(async () => {
      return twilioClient.autopilot
        .assistants
        .create(assistant_Obj)
    })

    //create a unique name if name exists
    .catch(async(err) => {

      if (err.message.includes("UniqueName already in use") || err.message.includes("Failed to create assistant "+schema.uniqueName)) {

        assistant_Obj.uniqueName = `${schema.uniqueName}-${Date.now()}`;
        assistant_Obj.friendlyName = `${schema.uniqueName}-${Date.now()}`;
        
        return twilioClient.autopilot
          .assistants
          .create(assistant_Obj)
      }
    })

    // delete hello-world task
    .then(async (assistant) => {

      await twilioClient.autopilot
      .assistants(assistant.uniqueName)
      .tasks
      .list()
      .then(async (tasks) => {

        if(tasks.length){

          for(let j=0 ; j < tasks.length; j++){

            await twilioClient.autopilot
            .assistants(assistant.uniqueName)
            .tasks(tasks[j].sid)
            .samples
            .list()
            .then(async (samples) => {

              if(samples.length)
              {

                for( let i = 0 ; i < samples.length ; i++){

                  await twilioClient.autopilot
                  .assistants(tasks[j].assistantSid)
                  .tasks(tasks[j].sid)
                  .samples(samples[i].sid)
                  .remove()
                }
              }
            })

            await twilioClient.autopilot
            .assistants(assistant.uniqueName)
            .tasks('hello-world')
            .remove()
            
          }
        }
      })

      return assistant;
    })

    //add tasks to assistant
    .then(async (assistant) => {

      if (schema.hasOwnProperty('tasks')) {

        for (let task of schema.tasks) {

          await twilioClient.autopilot
            .assistants(assistant.uniqueName)
            .tasks
            .create({ uniqueName: task.uniqueName, actions: task.actions })
            .then(result => {
            })

        }

      }

      return assistant;
    })

    //add custom fields to assistant
    .then(async (assistant) => {

      if (schema.hasOwnProperty('fieldTypes')) {

        for (let fieldType of schema.fieldTypes) {

          await twilioClient.autopilot
            .assistants(assistant.uniqueName)
            .fieldTypes
            .create({ uniqueName: fieldType.uniqueName })
            .then(result => {
            })

          if (fieldType.hasOwnProperty('values')) {

            // adding field values that have synonyms
            for (let value of fieldType.values) {

              if(!value.synonymOf){

                await twilioClient.autopilot
                .assistants(assistant.uniqueName)
                .fieldTypes(fieldType.uniqueName)
                .fieldValues
                .create({ language: value.language, value: value.value, synonymOf: (value.synonymOf)?value.synonymOf:'' })
                .then(result => {
                })
              
              }
            
            }

            //adding synonyms to field values
            for (let value of fieldType.values) {

              if(value.synonymOf){

                await twilioClient.autopilot
                .assistants(assistant.uniqueName)
                .fieldTypes(fieldType.uniqueName)
                .fieldValues
                .create({ language: value.language, value: value.value, synonymOf: (value.synonymOf)?value.synonymOf:'' })
                .then(result => {
                })
              
              }
            
            }
          
          }
        
        }
      }

      return assistant;
    })

    //add fields to tasks
    .then(async (assistant) => {

      if (schema.hasOwnProperty('tasks')) {

        for (let task of schema.tasks) {

          if (task.hasOwnProperty('fields')) {

            for (let field of task.fields) {

              await twilioClient.autopilot
                .assistants(assistant.uniqueName)
                .tasks(task.uniqueName)
                .fields
                .create({ fieldType: field.fieldType, uniqueName: field.uniqueName })
                .then(result => {
                })
            
            }
          
          }
        
        }
      
      }

      return assistant;
    })

    //add samples
    .then(async (assistant) => {

      if (schema.hasOwnProperty('tasks')) {

        for (let task of schema.tasks) {

          for (let sample of task.samples) {

            await twilioClient.autopilot
              .assistants(assistant.uniqueName)
              .tasks(task.uniqueName)
              .samples
              .create({ language: sample.language, taggedText: sample.taggedText })
              .then(result => {
              })
          
          }
        
        }
      
      }
      return assistant;
    })

    //start model build 
    .then(async (assistant) => {

      await twilioClient.autopilot
        .assistants(assistant.uniqueName)
        .modelBuilds
        .create({ uniqueName: assistant.uniqueName })
        .then(result => {
          //log result
        })

      return assistant;
    })

    .catch(err => {
      throw err;
    })

}

module.exports = { createAssistantFully };