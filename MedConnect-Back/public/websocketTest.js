const socket = io('http://localhost:3000', {
      auth: { token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlIjoicGF0aWVudCIsImlhdCI6MTc2NjU4Nzg5NywiZXhwIjoxNzY3MTkyNjk3fQ.Xd7a5lbxZa3LVKVQlJplsG_31eKY21apbUeAuSzpFVA' }
    });

    socket.on('connected', (data) => {
      console.log('Connected:', data);
    });

    socket.emit('send_message', {
      receiver_id: 2,
      message_content: 'Hello via WebSocket!'
    });

    socket.on('receive_message', (data) => {
      console.log('New message received:', data.message);
    });