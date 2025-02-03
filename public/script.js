// Socket.io setup
const socket = io('http://localhost:3000');

// DOM elements
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const startBtn = document.getElementById('startBtn');
const nextBtn = document.getElementById('nextBtn');

let localStream;
let remoteStream;
let peerConnection;

// WebRTC configuration
const configuration = {
    iceServers: [
        {
            urls: 'stun:stun.l.google.com:19302'
        }
    ]
};

// Start video call
startBtn.addEventListener('click', async () => {
    startBtn.disabled = true;
    nextBtn.disabled = false;

    // Get user media (camera and microphone)
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;

    // Send 'start' event to backend to find a random user
    socket.emit('start');
});

// Receive remote video stream
socket.on('video', (stream) => {
    remoteStream = stream;
    remoteVideo.srcObject = remoteStream;
});

// Next user button
nextBtn.addEventListener('click', () => {
    socket.emit('next');
    localStream.getTracks().forEach(track => track.stop()); // Stop local video
    localVideo.srcObject = null;
    remoteVideo.srcObject = null; // Clear remote video
    nextBtn.disabled = true;
    startBtn.disabled = false;
});

// Handle peer connection (for WebRTC signaling)
socket.on('offer', async (offer) => {
    peerConnection = new RTCPeerConnection(configuration);

    // Add local stream to peer connection
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    // Create an answer to the offer
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    // Send answer to server
    socket.emit('answer', answer);

    // Receive remote stream
    peerConnection.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
    };
});

// Handle ICE candidates
peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
        socket.emit('candidate', event.candidate);
    }
};

// When a new candidate is received, add it to the peer connection
socket.on('candidate', (candidate) => {
    if (peerConnection) {
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
});
