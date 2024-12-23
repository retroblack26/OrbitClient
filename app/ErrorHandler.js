class ErrorHandler {
    constructor({ process, callback}){

        if(!process || !callback){
            console.error("ErrorHandler class need a process name (main, core or preload) and a callback function for message show.")
        }

        if(typeof callback !== 'function'){
            console.error("Callback need to be a function.");
        }

        this.process = process;
        this.callback = callback;

        this.createEventHandlers();
    }

    createEventHandlers(){
        if (this.process == "main") {
            process.on('uncaughtException', (error) => {
                this.callback(error);
            });
        }else{          
          window.addEventListener('unhandledrejection', (event) => {
           this.callback(event.reason);
          })
        }
    }
}
module.exports = ErrorHandler;