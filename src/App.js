import React, { useState, useEffect, useRef } from "react";
import logo from "./logo.svg";
import "./App.css";
import { ReactComponent as Down } from "./down.svg";
import * as firebase from "firebase";

const firebaseConfig = {
  apiKey: "AIzaSyD2KCjdds6S99QiRIlMWd4pfv8n14vhbvM",
  authDomain: "deduce-chat.firebaseapp.com",
  databaseURL: "https://deduce-chat.firebaseio.com",
  projectId: "deduce-chat",
  storageBucket: "deduce-chat.appspot.com",
  messagingSenderId: "1097746995795",
  appId: "1:1097746995795:web:65419f51731006db8584a6",
  measurementId: "G-KV6BJD90PY",
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

function App() {
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);
  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState([]);
  const [scrolled, setScrolled] = useState(false);

  const chatRoom = db.ref().child("chatrooms").child("global");
  const messagesEndRef = useRef(null);
  const messagesDivRef = useRef(null);

  function scrolledToBottom(el) {
    return el.scrollHeight - el.scrollTop - el.clientHeight == 0;
  }
  const scrollToBottom = () => {
    if (messagesEndRef.current && !scrolled) {
      messagesEndRef.current.scrollIntoView();
    }
  };
  useEffect(scrollToBottom, [messages]);
  useEffect(scrollToBottom, []);
  useEffect(() => {
    const handleNewMessages = (data) => {
      if (data.val()) {
        const size = parseInt(window.localStorage.getItem("size"));
        const msgs = JSON.parse(window.localStorage.getItem("messages")) || [];
        if (size < 50) {
          window.localStorage.setItem("size", JSON.stringify(size + 1));
          window.localStorage.setItem("last", data.val().timestamp);
          window.localStorage.setItem(
            "messages",
            JSON.stringify([...msgs, data.val()])
          );
          setMessages((old) => {
            return [...msgs, data.val()];
          });
        } else {
          window.localStorage.setItem("last", data.val().timestamp);
          const newMessages = msgs.slice(msgs.length / 2);
          window.localStorage.setItem(
            "size",
            JSON.stringify(newMessages.length + 1)
          );
          window.localStorage.setItem(
            "messages",
            JSON.stringify([...newMessages, data.val()])
          );
          setMessages((old) => {
            return [...newMessages, data.val()];
          });
        }
      }
    };
    const size = window.localStorage.getItem("size");
    if (size == 0 || size == null) {
      chatRoom.endAt().limitToLast(50).on("child_added", handleNewMessages);
    } else {
      setMessages(JSON.parse(window.localStorage.getItem("messages")));
      chatRoom
        .orderByChild("timestamp")
        .startAt(parseInt(window.localStorage.getItem("last")))
        .on("child_added", handleNewMessages);
    }
    return () => {
      chatRoom.off("child_added", handleNewMessages);
    };
  }, []);

  const handleNameChange = (e) => setNickname(e.target.value);
  const handleEmailChange = (e) => setEmail(e.target.value);
  const handleClick = (e) => {
    db.ref().child("nicknames").push({
      nickname,
      email,
    });
    setJoined(true);
  };

  const handleMsgChange = (e) => setMsg(e.target.value);
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      chatRoom.push({
        sender: nickname,
        msg,
        timestamp: Date.now(),
      });
      setMsg("");
    }
  };

  return (
    <div className="App">
      {!joined ? (
        <div className="joinForm">
          <input
            placeholder="Nickname"
            value={nickname}
            onChange={handleNameChange}
          />
          <br />
          <input
            placeholder="Email"
            value={email}
            onChange={handleEmailChange}
          />
          <br />
          <button onClick={handleClick}>Join</button>
        </div>
      ) : (
        <div className="chat">
          <div
            className="messages"
            ref={messagesDivRef}
            onWheel={(e) => {
              if (scrolledToBottom(messagesDivRef.current)) {
                setScrolled(false);
              } else {
                setScrolled(true);
              }
            }}
            onTouchMove={(e) => {
              // if (elementInViewport(messagesEndRef.current)) {
              //   setScrolled(false);
              // } else {
              //   setScrolled(true);
              // }
            }}
          >
            {messages.map((message) => {
              if (message["sender"] === nickname)
                return (
                  <div className="my-message">
                    {/*<span id="me">{message["sender"]} :</span>*/}
                    {/*<br />*/}
                    <div className={"msg-text"}>{message["msg"]}</div>
                  </div>
                );
              else
                return (
                  <div className="message">
                    <span id="sender">{message["sender"]}</span>
                    <br />
                    <div className={"msg-text"}>{message["msg"]}</div>
                  </div>
                );
            })}
            <div ref={messagesEndRef} />
          </div>
          {/*{scrolled ? (
            <button
              id="scrollbutton"
              onClick={(e) => {
                console.log("bnmbnm");
                messagesEndRef.current.scrollIntoView();
                setScrolled(false);
              }}
            >
              Scroll to bottom
            </button>
          ) : (
            ""
          )}*/}
          {scrolled ? (
            <Down
              id="scroll-icon"
              onClick={(e) => {
                messagesEndRef.current.scrollIntoView();
                setScrolled(false);
              }}
            />
          ) : (
            ""
          )}
          <div className={"chat-input"}>
            <input
              placeholder="msg"
              onChange={handleMsgChange}
              onKeyDown={handleKeyDown}
              value={msg}
            />
          </div>
        </div>
      )}
    </div>
  );
}
export default App;
