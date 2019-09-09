const _ = require('underscore');

const Task_Samples = async (intentSamples) => {
    let samples = [];
    try{
        if(intentSamples.length){

            for(let i = 0 ; i < intentSamples.length ; i ++){

                const sample = await combineSample(intentSamples[i].data);

                const index = _.findIndex(samples, {taggedText : sample});

                if(index<0){
                    samples.push({
                        "language" : "en-US",
                        "taggedText" : sample.replace(/\n+|\t+|\r+/g, " ")
                    })
                }
                
            }
        }
        return samples;
    }catch(err){

        throw err;
    }
    
}

const combineSample = async (data) => {
    let sample = ``;

    if(data.length){
        for(let i = 0 ; i < data.length ; i ++){
            sample+= (data[i].hasOwnProperty('alias')) ? `{${data[i].alias}}` : `${data[i].text}`;
    
            if(i === data.length - 1){
                return sample;
            }
        }
    }else{
        return sample;
    }
    
}

module.exports = {Task_Samples};