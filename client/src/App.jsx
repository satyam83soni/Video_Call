import { useState, useEffect, useRef } from "react";
import { Socket } from "./socket/socket";
import Button from "@mui/material/Button";
const App = () => {
  const [myId, setMyId] = useState("");
  const [status, setStatus] = useState("");
  const [users, setUsers] = useState([]);
  const [muted, setMuted] = useState(true);
  const [callRunning, setCallRunning] = useState(false);
  const socket = useRef(null);
  const peer = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [show, setShow] = useState(true);
  const [dataC , setDataC]= useState();
  const [callFrom , setCallFrom] = useState();

  

  let myStream;
  async function acceptCall() {
    try {
      console.log("trying to accept call");
      console.log(dataC);
      const { from, offer } = dataC;
      await peer.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answerOffer = await peer.current.createAnswer();
      await peer.current.setLocalDescription(
        new RTCSessionDescription(answerOffer)
      );
      Socket.emit("call:accepted", { answer: answerOffer, to: from });

       myStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      myStream
        .getTracks()
        .forEach((track) => peer.current.addTrack(track, myStream));
      console.log("accepted call");
      setCallRunning(true);
      setCallFrom(from)
    } catch (error) {
      console.log(error);
    }
  }



  const rejectCall = () => {
    const { from } = dataC; // Assuming `dataC` contains the caller's information
    socket.current.emit('call:rejected', { to: from });
    console.log("Call rejected");
};

  useEffect(() => {
    socket.current = Socket;

    peer.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.stunprotocol.org" }],
    });

    const handleIncomingStream = async ({ streams: [stream] }) => {
      setStatus("Incoming Stream");
      remoteVideoRef.current.srcObject = stream;
      remoteVideoRef.current.play();

      const myStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      myStream
        .getTracks()
        .forEach((track) => peer.current.addTrack(track, myStream));
    };

    peer.current.ontrack = handleIncomingStream;

    socket.current.on("users:joined", (id) => {
      console.log(id, "id is useer ");
      setUsers((prevUsers) => [...prevUsers, id]);
    });


    socket.current.on('call:rejected', (data) => {
      console.log(data.message); // "Call was rejected by the recipient."
      setStatus('Call was rejected');
  });

    socket.current.on("incoming:answer", async (data) => {
      console.log("recieved call");
      setStatus("Incoming Answer");
      console.log("hii", data);
      const { offer } = data;
      await peer.current.setRemoteDescription(new RTCSessionDescription(offer));
    });



    socket.current.on('call:hangup', () => {
      // Close the peer connection
      if (peer.current) {
        peer.current.close();
        peer.current = null;
      }
    
      // Stop the local video and audio streams
      if (myStream) {
        myStream.getTracks().forEach(track => track.stop());
        myStream = null;
      }
      setCallRunning(false)
      // Clear the remote video element
      remoteVideoRef.current.srcObject = null;
    
      // Update the UI
      setStatus('Call ended by the other user');
      console.log("call ended by the other user");
    });

    socket.current.on("user:disconnect", (id) => {
      console.log(id, "id is disconnect");
      setUsers((prevUsers) => prevUsers.filter((userId) => userId !== id));
    });

    socket.current.on("incoming:call", async (data) => {
      console.log("call coming");
      setStatus(`Incoming Call ${data}`);
      console.log("hii", data);
      setDataC(data);
      setCallRunning(false);
    });

    socket.current.on("hello", ({ id }) => {
      console.log(id);
      setMyId(id);
    });

    // const getAndUpdateUsers = async () => {
    //   const response = await fetch("/users", { method: "GET" });
    //   const jsonResponse = await response.json();
    //   setUsers(jsonResponse.map((user) => user[0]));
    // };

    const getUserMedia = async () => {
      const userMedia = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      console.log("usermedia", userMedia);
      localVideoRef.current.srcObject = userMedia;
      localVideoRef.current.play();
    };

    //  getAndUpdateUsers();
    getUserMedia();

    return () => {
      // socket.current.disconnect();
    };
  }, []);

  const createCall = async (to) => {
    setStatus(`Calling ${to}`);
    console.log("calling started");
    setCallRunning(true);
    const localOffer = await peer.current.createOffer();
    await peer.current.setLocalDescription(
      new RTCSessionDescription(localOffer)
    );
    socket.current.emit("outgoing:call", { fromOffer: localOffer, to });
  };

  const toggleMute = () => {
    setMuted(!muted);

    // Emit mute/unmute event
    socket.current.emit("mute", { isMuted: muted });
  };

  const hangUpCall = () => {
    // Notify the other user about the call hangup
    socket.current.emit('call:hangup', { to: callFrom });
  
    // Close the peer connection
    if (peer.current) {
      peer.current.close();
      peer.current = null;
    }
    setCallRunning(false)
    setCallFrom(null)
  
    // Stop the local video and audio streams
    if (myStream) {
      myStream.getTracks().forEach(track => track.stop());
      myStream = null;
    }
  
    // Clear the remote video element
    remoteVideoRef.current.srcObject = null;
  
    // Update the UI (e.g., reset the status, hide the video elements, etc.)
    setStatus('Call ended');
    console.log("call ended");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow p-5">
        <div className="flex gap-5">
          <>
            {show && (
              <div
                id="users"
                className="flex flex-col gap-2 p-5 border rounded-md border-red-500 w-[30vw]"
              >
                {users.map((user) => (
                  <Button
                    variant="contained"
                    key={user}
                    onClick={() => createCall(user)}
                  >
                    {"==>CONNECTED  " + user}
                  </Button>
                ))}
              </div>
            )}
          </>

          <div className="bg-slate-600 border border-slate-500 rounded-md">
            <div className="flex flex-col">
              <h3>
                Your Id: <span>{myId}</span>
              </h3>
              <video
                ref={localVideoRef}
                id="local-video"
                className="rounded-md"
              />
            </div>

            <div>
              <h3>Online Users (click to connect)</h3>
              <video
                ref={remoteVideoRef}
                id="remote-video"
                className="rounded-md"
              />
            </div>

            <p id="status">{status}</p>
          </div>
        </div>
      </div>
      {callRunning ? (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800 p-3 flex justify-center gap-4">
          <Button variant="contained" onClick={() => setShow(true)}>
            Show Users
          </Button>

          <Button variant="contained" onClick={() => setShow(false)}>
            Hide Users
          </Button>

          <Button
            variant="contained"
            onClick={() => socket.current.disconnect()}
          >
            Disconnect
          </Button>

          <Button variant="contained" onClick={toggleMute}>
            {muted ? "Unmute" : "Mute"}
          </Button>

          <Button
            variant="contained"
            onClick={() => socket.current.emit("call:cancel")}
          >
            Switch Camera
          </Button>

          <Button
            variant="contained"
            onClick={hangUpCall}
          >
            Hang Up
          </Button>
        </div>
      ) : (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800 p-3 flex justify-center gap-4">
          <Button variant="contained" onClick={() => setShow(true)}>
            Show Users
          </Button>

          <Button variant="contained" onClick={() => setShow(false)}>
            Hide Users
          </Button>

          <Button variant="contained" onClick={acceptCall}>
            Accept
          </Button>

          <Button
            variant="contained"
            onClick={rejectCall}
          >
            Reject
          </Button>
        </div>
      )}
    </div>
  );
};

export default App;
