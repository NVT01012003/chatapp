import Navbar from "./navbar";
import Messages from "./messages";
import Input from "./input";
import "../pages/styles/chat.scss";
import { useContext } from "react";
import { StoreContext } from "../contexts/StoreContext";
import { ChatContext } from "../contexts/chatContext";
import MessengerWelcome from "./messengerWelcome";
import { AuthContext } from "../contexts/authContext";

function Chat({ data }) {
    const { toast } = data;
    const { store, dispatch } = useContext(StoreContext);
    const { currentChat, setCurrentChat } = useContext(ChatContext);
    const { currentUser, refreshToken } = useContext(AuthContext);
    return (
        <div className="chat-container" id={data.hidden ? "hidden" : ""}>
            {(currentChat &&
                currentChat.members?.includes(currentUser.user_id) && (
                    <div>
                        <Navbar
                            data={{
                                setHidden: data.setHidden,
                                currentChat,
                                currentUser,
                                store,
                            }}
                        />
                        <Messages
                            data={{
                                currentChat,
                                store,
                                currentUser,
                                toast,
                                dispatch,
                                refreshToken,
                            }}
                        />
                        <Input
                            data={{
                                dispatch,
                                currentChat,
                                currentUser,
                                toast,
                                setCurrentChat,
                                store,
                            }}
                        />
                    </div>
                )) || (
                <div className="welcome">
                    <MessengerWelcome />
                </div>
            )}
        </div>
    );
}

export default Chat;
