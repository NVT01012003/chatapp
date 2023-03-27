import Navigate from "../components/navigate";
import Sidebar from "../components/sidebar";
import Chat from "../components/chat";
import ChatInfo from "../components/chatInfo";
import "./styles/messenger.scss";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/authContext";
import { useNavigate } from "react-router-dom";
// import { socket } from "../websocket/socket";
import { StoreContext } from "../contexts/StoreContext";
import { publicInstance } from "../config/axiosConfig";
import LoadingResource from "../components/loadingResource";
import { ToastContainer, toast } from "react-toastify";

function Messenger() {
    const { currentUser, refreshToken, getUser, setCurrentUser } =
        useContext(AuthContext);
    const { dispatch } = useContext(StoreContext);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();
    useEffect(() => {
        if (Object.keys(currentUser).length == 0) {
            getUser()
                .then((user) => {
                    if (user) setCurrentUser(user);
                    else {
                        navigate("/login");
                    }
                })
                .catch((e) => {
                    navigate("/login");
                });
        } else {
            try {
                publicInstance
                    .get(`/user/${currentUser.user_id}/get_resource`)
                    .then(({ data }) => {
                        const { chats, messages, users } = data.elements;
                        const chatsObj = {};
                        for (const chat of chats) {
                            chatsObj[chat.id] = chat;
                        }
                        const messagesObj = {};
                        for (const message of messages) {
                            messagesObj[message.chat_id] = message;
                        }
                        const usersObj = {};
                        for (const user of users) {
                            usersObj[user.id] = user;
                        }
                        dispatch({
                            type: "ADD_CHATS",
                            chats: chatsObj,
                        });
                        dispatch({
                            type: "ADD_MESSAGES",
                            messages: messagesObj,
                        });
                        dispatch({
                            type: "ADD_USERS",
                            users: usersObj,
                        });
                        setLoading(false);
                    })
                    .catch((e) => {
                        if (
                            e.response?.data?.message != "No token provided" ||
                            e.response?.data?.message != "Unauthorized" ||
                            e.response?.data?.message != "jwt expired"
                        ) {
                            refreshToken().then(async (res) => {
                                const { data } = await publicInstance.get(
                                    `/user/${currentUser.user_id}/get_resource`
                                );
                                const { chats, messages, users } =
                                    data.elements;
                                const chatsObj = {};
                                for (const chat of chats) {
                                    chatsObj[chat.id] = chat;
                                }
                                const messagesObj = {};
                                for (const message of messages) {
                                    messagesObj[message.chat_id] = message;
                                }
                                const usersObj = {};
                                for (const user of users) {
                                    usersObj[user.id] = user;
                                }
                                dispatch({
                                    type: "ADD_CHATS",
                                    chats: chatsObj,
                                });
                                dispatch({
                                    type: "ADD_MESSAGES",
                                    messages: messagesObj,
                                });
                                dispatch({
                                    type: "ADD_USERS",
                                    users: usersObj,
                                });
                                setLoading(false);
                            });
                        } else navigate("/loading_error");
                    });
                //     socket.emit("add-user", { user_id: currentUser?.user_id });
            } catch (e) {
                setLoading(false);
                navigate("/loading_error");
            }
        }
    }, [currentUser]);

    return (
        <div>
            {(!loading && (
                <div className="messenger-container">
                    <Navigate toast={toast} />
                    <Sidebar toast={toast} />
                    <Chat toast={toast} />
                    <ChatInfo toast={toast} />
                </div>
            )) || <LoadingResource />}
            <ToastContainer />
        </div>
    );
}

export default Messenger;
