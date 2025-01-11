const socket = io("/");
const videoGrid = document.getElementById('video-grid');
const peers = {};
const peer = new Peer(undefined, {
    host: 'localhost',
    port: 30001,
    path: '/'
});

const myVideo = document.createElement('video');
myVideo.muted = true;
myVideo.autoplay = true;

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    // Display own video
    addVideoStream(myVideo, stream);

    // Handle incoming video calls
    peer.on('call', call => {
        call.answer(stream);  // Answer call with own stream
        const video = document.createElement('video');
        video.muted = true;
        video.autoplay = true;
        
        // Add caller's video stream
        call.on('stream', userVideoStream => {
            addVideoStream(video, userVideoStream);
        });
    });

    // When new user connects
    socket.on("user-connected", userId => {
        connectToNewUser(userId, stream);
    });

}).catch(error => {
    // Handle media access errors
    console.error('Error accessing media devices:', error);
    // Show appropriate error message
});

// Handle user disconnection
socket.on("user-disconnected", userId => {
    if (peers[userId]) {
        peers[userId].close();
        delete peers[userId];
    }
});

// Function to connect to new user
function connectToNewUser(userId, stream) {
    const call = peer.call(userId, stream);
    const video = document.createElement('video');
    
    // Add new user's video stream
    call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream);
    });

    // Remove video when user leaves
    call.on('close', () => {
        video.remove();
    });

    peers[userId] = call;
}

// When peer connection is established this pass to join-room
peer.on('open', id => {
    socket.emit("join-room", ROOM_ID, id);
});

// Helper function to add video stream to grid
function addVideoStream(video, stream) {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
        video.play();
    });
    videoGrid.append(video);
}
