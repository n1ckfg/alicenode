function send_all_clients(msg) {
         wss.clients.forEach(function each(client) {
            client.send(msg);
         });
     }