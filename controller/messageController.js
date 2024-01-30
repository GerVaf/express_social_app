const socketService = require("../service/socketService");
const { tryCatch } = require("../utils/tryCatch");

exports.sendMessage = tryCatch(async(req,res)=>{
     try {

          const io = socketService.getIO()
          io.emit('someEvent', { message: 'Hello from someController!' });
          io.on('sendMessage',(data)=>console.log(data))
          
     } catch (error) {
          console.log(error)
     }
})