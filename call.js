const callSocket = io();

let localStream;
let remoteStream = new MediaStream();
let peerConnection = new RTCPeerConnection();
let mediaRecorder;
let isRecording = false;

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const statusBox = document.getElementById('call-status');

function updateStatus(text) {
  if (statusBox) statusBox.textContent = text;
}

// === Start Call ===
async function startCall() {
  updateStatus("📞 Calling...");
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  localVideo.srcObject = localStream;

  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  callSocket.emit('webrtc-offer', { offer });
}

// === Accept/Reject Offer ===
callSocket.on('webrtc-offer', async ({ offer }) => {
  const accept = confirm("📞 Incoming call — accept?");
  if (!accept) return;

  updateStatus("🔗 Connecting...");
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  localVideo.srcObject = localStream;

  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  callSocket.emit('webrtc-answer', { answer });
});

callSocket.on('webrtc-answer', async ({ answer }) => {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  updateStatus("✅ Connected");
});

// === Handle Remote Stream ===
peerConnection.ontrack = (event) => {
  event.streams[0].getTracks().forEach(track => remoteStream.addTrack(track));
  remoteVideo.srcObject = remoteStream;
};

// === End Call ===
function endCall() {
  peerConnection.close();
  localStream.getTracks().forEach(track => track.stop());
  remoteStream.getTracks().forEach(track => track.stop());

  localVideo.srcObject = null;
  remoteVideo.srcObject = null;
  updateStatus("📴 Call ended");

  if (isRecording) stopRecording();
}

// === Mute/Unmute ===
function toggleMute() {
  const enabled = localStream.getAudioTracks()[0].enabled;
  localStream.getAudioTracks()[0].enabled = !enabled;
}

// === Video On/Off ===
function toggleVideo() {
  const enabled = localStream.getVideoTracks()[0].enabled;
  localStream.getVideoTracks()[0].enabled = !enabled;
}

// === Recording ===
function startRecording() {
  const recordedChunks = [];
  mediaRecorder = new MediaRecorder(localStream);
  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) recordedChunks.push(e.data);
  };
  mediaRecorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recording.webm';
    a.click();
  };
  mediaRecorder.start();
  isRecording = true;
  updateStatus("⏺️ Recording...");
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
    isRecording = false;
    updateStatus("✅ Recording saved");
  }
}
