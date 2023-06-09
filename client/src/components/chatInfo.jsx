/* eslint-disable jsx-a11y/alt-text */
import { useContext, useEffect, useState } from "react";
import { ChatContext } from "../contexts/chatContext";
import { StoreContext } from "../contexts/StoreContext";
import "../pages/styles/chatInfo.scss";
import Close from "../imgs/close.png";
import { publicInstance } from "../config/axiosConfig";
import { useNavigate } from "react-router-dom";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../config/firebase/firebase";
import AddUser from "../imgs/user.png";
import RemoveUser from "../imgs/removeUser.png";
import AddAdmin from "../imgs/addAdmin.png";
import catLoading from "../imgs/LoadingError.gif";
import Loading from "../imgs/Loading.gif";
import { socket } from "../socket/socket";

function ChatInfo({ data }) {
    const {
        toast,
        hidden,
        setHidden,
        currentUser,
        refreshToken,
        firstMount,
        setFirstMount,
    } = data;
    const { currentChat, setCurrentChat } = useContext(ChatContext);
    const { store, dispatch, sortChats } = useContext(StoreContext);
    const [name, setName] = useState("");
    const [inputName, setInputName] = useState(null);
    const [groupNameToggle, setGroupNameToggle] = useState(false);
    const [inputSearchUser, setInputSearchUser] = useState("");
    const [searchUserToggle, setSearchUserToggle] = useState(false);
    const [searched, setSearched] = useState(false);
    const [friends, setFriends] = useState(null);
    const [usersAdded, setUserAdded] = useState([]);
    const [showAllMembers, setShowAllMembers] = useState(false);
    const [showAllAdmins, setShowAllAdmins] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingError, setLoadingError] = useState(false);
    let changed = false;
    const navigate = useNavigate();

    const setChanged = (bool) => (changed = bool);

    useEffect(() => {
        !currentChat && setHidden(true);
    }, [currentChat]);

    useEffect(() => {
        changed = true;
    }, [currentChat?.id]);
    useEffect(() => {
        if (!currentChat?.is_group) {
            const name =
                currentChat?.members[0] != currentUser.user_id
                    ? store.users[currentChat?.members[0]]?.display_name
                    : store.users[currentChat?.members[1]]?.display_name;
            setName(
                // eslint-disable-next-line eqeqeq
                name
            );
        } else {
            const name =
                currentChat?.name ||
                `${currentChat.members.map(
                    (id) => store.users[id].display_name
                )}`;
            setName(name);
        }
        const getPhotos = async () => {
            try {
                const { data } = await publicInstance.get(
                    `/message/${currentChat.id}/get_photos`
                );
                dispatch({
                    type: "ADD_PHOTOS",
                    photos: data.elements,
                });
                let photos_obj = {};
                data.elements.forEach(
                    (photo) => (photos_obj[photo.id] = photo)
                );
            } catch (e) {
                const data = e.response.data;
                if (data.message == "jwt expired") {
                    refreshToken()
                        .then(async (res) => {
                            const { data } = await publicInstance.get(
                                `/message/${currentChat.id}/get_photos`
                            );
                            if (data.status == "success") {
                                dispatch({
                                    type: "ADD_PHOTOS",
                                    messages: data.elements,
                                });
                                let photos_obj = {};
                                data.elements.forEach(
                                    (photo) => (photos_obj[photo.id] = photo)
                                );
                            }
                        })
                        .catch((e) => {
                            if (e == "Server error") {
                                toast("Server error! Please try again.");
                            } else {
                                toast(
                                    "The login session has expired! Please login again."
                                );
                                setTimeout(() => {
                                    navigate("/login");
                                }, 6000);
                            }
                        });
                }
            }
        };
        (firstMount || changed) &&
            currentChat &&
            !store.photos[currentChat.id] &&
            store.messages[currentChat.id] &&
            getPhotos() &&
            setFirstMount(false) &&
            setChanged(false);

        currentChat &&
            store.photos[currentChat.id] &&
            store.messages[currentChat.id] &&
            Object.keys(store.photos[currentChat.id]).length !=
                Object.entries(store.messages[currentChat.id]).filter(
                    ([key, value]) => {
                        return value.photo_url;
                    }
                ).length &&
            getPhotos();
        currentChat &&
            !store.photos[currentChat.id] &&
            store.messages[currentChat.id] &&
            Object.entries(store.messages[currentChat.id]).filter(
                ([key, value]) => {
                    return value.photo_url;
                }
            ).length > 0 &&
            getPhotos();
    }, [
        currentChat?.id,
        currentUser,
        store.users[currentChat?.members[0]]?.display_name,
        store.users[currentChat?.members[1]]?.display_name,
    ]);

    const hanleSetName = async (e) => {
        if (e.keyCode == "13") {
            setGroupNameToggle(false);
            try {
                const { data } = await publicInstance.put(
                    `/chat/set_groupName/${currentChat.id}`,
                    { name: inputName }
                );
                dispatch({
                    type: "ADD_CHATS",
                    chats: { [data.elements.id]: data.elements },
                });
                socket.emit("update-chat", {
                    chat: data.elements,
                });
                setCurrentChat(data.elements);
            } catch (err) {
                const data = err.response.data;
                if (data.message == "jwt expired") {
                    refreshToken()
                        .then(async (res) => {
                            const { data } = await publicInstance.put(
                                `/chat/set_groupName/${currentChat.id}`,
                                { name: inputName }
                            );
                            dispatch({
                                type: "ADD_CHATS",
                                chats: { [data.elements.id]: data.elements },
                            });
                            socket.emit("update-chat", {
                                chat: data.elements,
                            });
                            setCurrentChat(data.elements);
                        })
                        .catch((e) => {
                            if (e == "Server error") {
                                toast("Server error! Please try again.");
                            } else {
                                toast(
                                    "The login session has expired! Please login again."
                                );
                                setTimeout(() => {
                                    navigate("/login");
                                }, 6000);
                            }
                        });
                }
            }
        }
    };

    const hanleSetBackground = async (e, avatar) => {
        try {
            const background = e.target.files[0];
            const storageRef = ref(
                storage,
                (avatar && `${currentChat.id}/avatar`) ||
                    `${currentChat.id}/background`
            );
            const uploadTask = await uploadBytesResumable(
                storageRef,
                background
            );
            const avatar_url = await getDownloadURL(storageRef);
            try {
                const { data } = !avatar
                    ? await publicInstance.put(
                          `/chat/set_groupBackground/${currentChat.id}`,
                          { background_image: avatar_url }
                      )
                    : await publicInstance.put(
                          `/chat/set_chatAvatar/${currentChat.id}`,
                          { chat_avatar: avatar_url }
                      );
                dispatch({
                    type: "ADD_CHATS",
                    chats: { [data.elements.id]: data.elements },
                });
                socket.emit("update-chat", {
                    chat: data.elements,
                });
                setCurrentChat(data.elements);
            } catch (err) {
                const data = err.response.data;
                if (data.message == "jwt expired") {
                    refreshToken()
                        .then(async (res) => {
                            const { data } = !avatar
                                ? await publicInstance.put(
                                      `/chat/set_groupBackground/${currentChat.id}`,
                                      { background_image: avatar_url }
                                  )
                                : await publicInstance.put(
                                      `/chat/set_chatAvatar/${currentChat.id}`,
                                      { chat_avatar: avatar_url }
                                  );

                            dispatch({
                                type: "ADD_CHATS",
                                chats: { [data.elements.id]: data.elements },
                            });
                            socket.emit("update-chat", {
                                chat: data.elements,
                            });
                            setCurrentChat(data.elements);
                        })
                        .catch((e) => {
                            if (e == "Server error") {
                                toast("Server error! Please try again.");
                            } else {
                                toast(
                                    "The login session has expired! Please login again."
                                );
                                setTimeout(() => {
                                    navigate("/login");
                                }, 6000);
                            }
                        });
                }
            }
        } catch (err) {
            toast("Something went wrong! Please try again.");
        }
    };

    const handleSetDefaultBackground = async (e) => {
        if (!currentChat.background_image)
            return toast("Current background is default!");

        try {
            const { data } = await publicInstance.put(
                `/chat/set_groupBackground/${currentChat.id}`,
                { background_image: null }
            );
            dispatch({
                type: "ADD_CHATS",
                chats: { [data.elements.id]: data.elements },
            });
            socket.emit("update-chat", {
                chat: data.elements,
            });
            setCurrentChat(data.elements);
        } catch (err) {
            const data = err.response.data;
            if (data.message == "jwt expired") {
                refreshToken()
                    .then(async (res) => {
                        const { data } = await publicInstance.put(
                            `/chat/set_groupBackground/${currentChat.id}`,
                            { background_image: null }
                        );
                        dispatch({
                            type: "ADD_CHATS",
                            chats: { [data.elements.id]: data.elements },
                        });
                        socket.emit("update-chat", {
                            chat: data.elements,
                        });
                        setCurrentChat(data.elements);
                    })
                    .catch((e) => {
                        if (e == "Server error") {
                            toast("Server error! Please try again.");
                        } else {
                            toast(
                                "The login session has expired! Please login again."
                            );
                            setTimeout(() => {
                                navigate("/login");
                            }, 6000);
                        }
                    });
            }
        }
    };

    const hanldeSearchUser = async (e, chat) => {
        if (e.keyCode == 13 && inputSearchUser.length > 0) {
            if (store.friends && store.friends[currentUser.user_id]) {
                let pattern = new RegExp(`${inputSearchUser}`, "i");
                const list_friends_match = [];
                Object.values(store.friends[currentUser.user_id]).forEach(
                    (e) => {
                        if (
                            store.users[e.friend_id].display_name.match(
                                pattern
                            ) &&
                            e.status == "accept" &&
                            !store.chats[currentChat.id].members.includes(
                                e.friend_id
                            )
                        )
                            return list_friends_match.push(
                                store.users[e.friend_id]
                            );
                    }
                );

                setFriends(list_friends_match);
                setSearched(true);
                setSearchUserToggle(true);
            } else {
                toast("Please make friends to search");
                setSearched(true);
                setSearchUserToggle(true);
            }
        } else if (e.keyCode == 13 && inputSearchUser.length == 0)
            setSearched(false);
    };

    const handleAddAndRemove = (user_id) => {
        if (!usersAdded.includes(user_id))
            setUserAdded((pre) => [...pre, user_id]);
        else {
            setUserAdded((pre) => pre.filter((id) => id != user_id));
        }
    };

    const handleAddMembers = async (e) => {
        if (usersAdded.length == 0) return toast("Please choose users!");
        try {
            const { data } = await publicInstance.put(
                `/chat/add_members/${currentChat.id}`,
                { members: usersAdded }
            );
            if (data.status == "error") {
                return toast(data.message);
            }
            let members = {};
            const allUsers = [
                ...data.elements.chat.members,
                ...data.elements.chat.members_leaved,
            ];
            allUsers.forEach((member) => {
                members = {
                    ...members,
                    [member]: store.users[member],
                };
            });
            dispatch({
                type: "ADD_CHATS",
                chats: { [data.elements.chat.id]: data.elements.chat },
            });
            dispatch({
                type: "ADD_MESSAGES",
                messages: data.elements.notices,
            });
            socket.emit("add-chat", {
                chat: data.elements.chat,
                notices: data.elements.notices,
                members: members,
                members_added: usersAdded,
            });
            setCurrentChat(data.elements.chat);
            setSearchUserToggle(false);
            setSearched(false);
            setUserAdded([]);
            setInputSearchUser("");
        } catch (err) {
            const data = err.response.data;
            if (data.message == "jwt expired") {
                refreshToken()
                    .then(async (d) => {
                        const { data } = await publicInstance.put(
                            `/chat/add_members/${currentChat.id}`,
                            { members: usersAdded }
                        );
                        let members = {};
                        data.elements.chat.members.forEach((member) => {
                            members = {
                                ...members,
                                [member]: store.users[member],
                            };
                        });
                        dispatch({
                            type: "ADD_CHATS",
                            chats: {
                                [data.elements.chat.id]: data.elements.chat,
                            },
                        });
                        dispatch({
                            type: "ADD_MESSAGES",
                            messages: data.elements.notices,
                        });
                        socket.emit("add-chat", {
                            chat: data.elements.chat,
                            notices: data.elements.notices,
                            members: members,
                            members_added: usersAdded,
                        });
                        setCurrentChat(data.elements.chat);
                        setSearchUserToggle(false);
                        setSearched(false);
                        setUserAdded([]);
                        setInputSearchUser("");
                    })
                    .catch((e) => {
                        setSearchUserToggle(false);
                        setSearched(false);
                        setUserAdded([]);
                        setInputSearchUser("");
                        toast("Server error! Please try again.");
                        if (e == "Server error") {
                        } else {
                            toast(
                                "The login session has expired! Please login again."
                            );
                            setTimeout(() => {
                                navigate("/login");
                            }, 6000);
                        }
                    });
            } else {
                setSearchUserToggle(false);
                setInputSearchUser("");
                setSearched(false);
                setUserAdded([]);
                return toast("Something went wrong! Please try again.");
            }
        }
    };

    const handleRemoveMember = async (member) => {
        if (currentChat.members.length <= 3)
            return toast("Group must be equal or greater than 3 members!");
        setLoading(true);
        try {
            const { data } = await publicInstance.put(
                `/chat/remove_member/${currentChat.id}`,
                { member }
            );
            dispatch({
                type: "ADD_CHATS",
                chats: { [data.elements.chat.id]: data.elements.chat },
            });
            setCurrentChat(data.elements.chat);
            dispatch({
                type: "ADD_MESSAGES",
                messages: data.elements.notice,
            });
            socket.emit("remove-member", {
                chat: data.elements.chat,
                member: member,
                notice: data.elements.notice,
            });
            setLoading(false);
        } catch (err) {
            const data = err.response.data;
            if (data.message == "jwt expired") {
                refreshToken()
                    .then(async (res) => {
                        const { data } = await publicInstance.put(
                            `/chat/remove_member/${currentChat.id}`,
                            { member }
                        );
                        dispatch({
                            type: "ADD_CHATS",
                            chats: {
                                [data.elements.chat.id]: data.elements.chat,
                            },
                        });
                        setCurrentChat(data.elements.chat);
                        dispatch({
                            type: "ADD_MESSAGES",
                            messages: data.elements.notice,
                        });
                        socket.emit("remove-member", {
                            chat: data.elements.chat,
                            member: member,
                            notice: data.elements.notice,
                        });
                        setLoading(false);
                    })
                    .catch((e) => {
                        setLoading(false);
                        if (e == "Server error") {
                            setLoadingError(true);
                            setTimeout(() => {
                                setLoadingError(false);
                            }, 6000);
                            toast("Server error! Please try again.");
                        } else {
                            toast(
                                "The login session has expired! Please login again."
                            );
                            setTimeout(() => {
                                navigate("/login");
                            }, 6000);
                        }
                    });
            } else {
                setLoading(false);
                setLoadingError(true);
                setTimeout(() => {
                    setLoadingError(false);
                }, 6000);
                toast("Server error! Please try again.");
            }
        }
    };

    const handleDeleteChat = async (chat) => {
        setLoading(true);
        try {
            const { data } = await publicInstance.delete(
                `/chat/delete_chat/${currentChat.id}`
            );
            setHidden(true);
            dispatch({
                type: "REMOVE_CHAT",
                chat_id: chat.id,
            });
            setCurrentChat((pre) => {
                if (pre?.id != chat.id) return pre;
                else
                    return Object.keys(store.chats).filter((id) => id != pre.id)
                        .length == 0
                        ? undefined
                        : store.chats[
                              sortChats(store.chats).reverse()[0][1] != pre.id
                                  ? sortChats(store.chats).reverse()[0][1]
                                  : sortChats(store.chats).reverse()[1][1]
                          ];
            });
            socket.emit("delete-chat", {
                chat: data.elements.chat,
            });
            setLoading(false);
        } catch (err) {
            const data = err.response?.data;
            if (data?.message == "jwt expired") {
                refreshToken()
                    .then(async (res) => {
                        const { data } = await publicInstance.delete(
                            `/chat/delete_chat/${currentChat.id}`
                        );
                        setHidden(true);
                        dispatch({
                            type: "REMOVE_CHAT",
                            chat_id: chat.id,
                        });
                        setCurrentChat((pre) => {
                            if (pre?.id != chat.id) return pre;
                            else
                                return Object.keys(store.chats).filter(
                                    (id) => id != pre.id
                                ).length == 0
                                    ? undefined
                                    : store.chats[
                                          sortChats(
                                              store.chats
                                          ).reverse()[0][1] != pre.id
                                              ? sortChats(
                                                    store.chats
                                                ).reverse()[0][1]
                                              : sortChats(
                                                    store.chats
                                                ).reverse()[1][1]
                                      ];
                        });
                        socket.emit("delete-chat", {
                            chat: data.elements.chat,
                        });
                        setLoading(false);
                    })
                    .catch((e) => {
                        setHidden(true);
                        setLoading(false);
                        if (e == "Server error") {
                            setLoadingError(true);
                            setTimeout(() => {
                                setLoadingError(false);
                            }, 6000);
                            toast("Server error! Please try again.");
                        } else {
                            toast(
                                "The login session has expired! Please login again."
                            );
                            setTimeout(() => {
                                navigate("/login");
                            }, 6000);
                        }
                    });
            } else {
                setHidden(true);
                setLoading(false);
                setLoadingError(true);
                setTimeout(() => {
                    setLoadingError(false);
                }, 6000);
                toast("Server error! Please try again.");
            }
        }
    };
    const handleLeaveGroup = async (chat) => {
        setLoading(true);
        try {
            const { data } = await publicInstance.delete(
                `/chat/leave_group/${chat.id}`
            );
            setHidden(true);
            dispatch({
                type: "REMOVE_CHAT",
                chat_id: chat.id,
            });
            setCurrentChat((pre) => {
                return Object.keys(store.chats).filter((id) => id != pre?.id)
                    .length == 0
                    ? undefined
                    : store.chats[
                          sortChats(store.chats).reverse()[0][1] != pre?.id
                              ? sortChats(store.chats).reverse()[0][1]
                              : sortChats(store.chats).reverse()[1][1]
                      ];
            });
            socket.emit("leave-group", {
                chat: data.elements.chat,
                notice: data.elements.notice,
                member: data.elements.member,
            });
            setLoading(false);
        } catch (err) {
            const data = err.response?.data;
            if (data?.message == "jwt expired") {
                refreshToken()
                    .then(async (res) => {
                        const { data } = await publicInstance.delete(
                            `/chat/leave_group/${chat.id}`
                        );
                        setHidden(true);
                        dispatch({
                            type: "REMOVE_CHAT",
                            chat_id: chat.id,
                        });

                        setCurrentChat((pre) => {
                            return Object.keys(store.chats).filter(
                                (id) => id != pre?.id
                            ).length == 0
                                ? undefined
                                : store.chats[
                                      sortChats(store.chats).reverse()[0][1] !=
                                      pre?.id
                                          ? sortChats(
                                                store.chats
                                            ).reverse()[0][1]
                                          : sortChats(
                                                store.chats
                                            ).reverse()[1][1]
                                  ];
                        });
                        socket.emit("leave-group", {
                            chat: data.elements.chat,
                            notice: data.elements.notice,
                            member: data.elements.member,
                        });
                        setLoading(false);
                    })
                    .catch((e) => {
                        setHidden(true);
                        setLoading(false);
                        if (e == "Server error") {
                            setLoadingError(true);
                            setTimeout(() => {
                                setLoadingError(false);
                            }, 6000);
                            toast("Server error! Please try again.");
                        } else {
                            toast(
                                "The login session has expired! Please login again."
                            );
                            setTimeout(() => {
                                navigate("/login");
                            }, 6000);
                        }
                    });
            } else {
                setHidden(true);
                setLoading(false);
                setLoadingError(true);
                setTimeout(() => {
                    setLoadingError(false);
                }, 6000);
                toast("Server error! Please try again.");
            }
        }
    };

    const hanldeAddAdmin = async (member, chat) => {
        if (currentChat.admins.includes(member))
            return toast("Member is a admin");
        setLoading(true);
        try {
            const { data } = await publicInstance.put(
                `/chat/add_admin/${chat.id}`,
                { member }
            );
            if (data.status == "success") {
                dispatch({
                    type: "ADD_CHATS",
                    chats: { [data.elements.chat.id]: data.elements.chat },
                });
                setCurrentChat(data.elements.chat);
                dispatch({
                    type: "ADD_MESSAGES",
                    messages: [data.elements.notice],
                });
                socket.emit("add-admin", {
                    chat: data.elements.chat,
                    notice: data.elements.notice,
                });
            } else {
                toast("Member is a admin");
            }
            setLoading(false);
        } catch (err) {
            const data = err.response.data;
            if (data.message == "jwt expired") {
                refreshToken()
                    .then(async (res) => {
                        const { data } = await publicInstance.put(
                            `/chat/add_admin/${chat.id}`,
                            { member }
                        );
                        if (data.status == "success") {
                            dispatch({
                                type: "ADD_CHATS",
                                chats: {
                                    [data.elements.chat.id]: data.elements.chat,
                                },
                            });
                            setCurrentChat(data.elements.chat);
                            dispatch({
                                type: "ADD_MESSAGES",
                                messages: [data.elements.notice],
                            });
                            socket.emit("add-admin", {
                                chat: data.elements.chat,
                                notice: data.elements.notice,
                            });
                        } else {
                            toast("Member is a admin");
                        }
                        setLoading(false);
                    })
                    .catch((e) => {
                        setLoading(false);
                        if (e == "Server error") {
                            setLoadingError(true);
                            setTimeout(() => {
                                setLoadingError(false);
                            }, 6000);
                            toast("Server error! Please try again.");
                        } else {
                            toast(
                                "The login session has expired! Please login again."
                            );
                            setTimeout(() => {
                                navigate("/login");
                            }, 6000);
                        }
                    });
            } else {
                setLoading(false);
                setLoadingError(true);
                setTimeout(() => {
                    setLoadingError(false);
                }, 6000);
                toast("Server error! Please try again.");
            }
        }
    };

    return (
        currentChat && (
            <div
                className={hidden ? "info-container hidden" : "info-container"}
            >
                <div className="chat-title">
                    <span>{name}</span>
                    <img
                        src={Close}
                        className="close"
                        onClick={() => setHidden(true)}
                    />
                </div>
                <div className="chat_info-wrapper">
                    <div className="members">
                        <div className="title">
                            <div>
                                <div className="friends"></div>
                                <span>
                                    MEMBER (
                                    {
                                        store.chats[currentChat?.id].members
                                            .length
                                    }
                                    )
                                </span>
                            </div>
                            <span onClick={() => setShowAllMembers(true)}>
                                Show All
                            </span>
                        </div>
                        {store.chats[currentChat?.id].members.map(
                            (member, index) => {
                                if (index > 2) return;
                                return (
                                    <div key={index} className="member-info">
                                        <div className="wrapper">
                                            <div
                                                className="avatar"
                                                style={{
                                                    backgroundImage: `url(${store.users[member].avatar_url})`,
                                                }}
                                            ></div>
                                            <span className="member-name">
                                                {
                                                    store.users[member]
                                                        .display_name
                                                }
                                            </span>
                                        </div>
                                    </div>
                                );
                            }
                        )}

                        {showAllMembers && (
                            <div className="show_all-members">
                                <span
                                    className="x-symbol"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowAllMembers(false);
                                    }}
                                >
                                    ✗
                                </span>
                                <div className="container">
                                    <span className="title-members">
                                        Members
                                    </span>
                                    {store.chats[currentChat?.id].members.map(
                                        (member, index) => {
                                            return (
                                                <div
                                                    className="member"
                                                    key={
                                                        store.users[member]
                                                            .user_id
                                                    }
                                                >
                                                    <div className="info-wrapper">
                                                        <div
                                                            className="avatar"
                                                            style={{
                                                                backgroundImage: `url(${store.users[member].avatar_url})`,
                                                            }}
                                                        ></div>
                                                        <span
                                                            className={
                                                                "member_name"
                                                            }
                                                        >
                                                            {
                                                                store.users[
                                                                    member
                                                                ].display_name
                                                            }
                                                        </span>
                                                    </div>
                                                    {store.chats[
                                                        currentChat?.id
                                                    ].admins?.includes(
                                                        currentUser.user_id
                                                    ) && (
                                                        <div>
                                                            <img
                                                                onClick={() => {
                                                                    hanldeAddAdmin(
                                                                        member,
                                                                        currentChat
                                                                    );
                                                                }}
                                                                src={AddAdmin}
                                                            />
                                                            <img
                                                                onClick={() =>
                                                                    handleRemoveMember(
                                                                        member
                                                                    )
                                                                }
                                                                src={RemoveUser}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        }
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    {store.chats[currentChat?.id].admins && (
                        <div className="members">
                            <div className="title">
                                <div>
                                    <div className="friends"></div>
                                    <span>
                                        ADMINS (
                                        {
                                            store.chats[currentChat?.id].admins
                                                .length
                                        }
                                        )
                                    </span>
                                </div>
                                <span onClick={() => setShowAllAdmins(true)}>
                                    Show All
                                </span>
                            </div>
                            {store.chats[currentChat?.id].admins.map(
                                (member, index) => {
                                    if (index > 2) return;
                                    return (
                                        <div
                                            key={index}
                                            className="member-info"
                                        >
                                            <div className="wrapper">
                                                <div
                                                    className="avatar"
                                                    style={{
                                                        backgroundImage: `url(${store.users[member].avatar_url})`,
                                                    }}
                                                ></div>
                                                <span className="member-name">
                                                    {
                                                        store.users[member]
                                                            .display_name
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    );
                                }
                            )}
                            {showAllAdmins && (
                                <div className="show_all-members">
                                    <span
                                        className="x-symbol"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowAllAdmins(false);
                                        }}
                                    >
                                        ✗
                                    </span>
                                    <div className="container">
                                        <span className="title-members">
                                            Admins
                                        </span>
                                        {store.chats[
                                            currentChat?.id
                                        ].admins.map((member, index) => {
                                            return (
                                                <div
                                                    className="member"
                                                    key={
                                                        store.users[member]
                                                            .user_id
                                                    }
                                                >
                                                    <div className="info-wrapper">
                                                        <div
                                                            className="avatar"
                                                            style={{
                                                                backgroundImage: `url(${store.users[member].avatar_url})`,
                                                            }}
                                                        ></div>
                                                        <span
                                                            className={
                                                                "member_name"
                                                            }
                                                        >
                                                            {
                                                                store.users[
                                                                    member
                                                                ].display_name
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {currentChat &&
                        store.photos[currentChat?.id] &&
                        Object.keys(store.photos[currentChat?.id]).length > 0 &&
                        store.photos[currentChat.id][
                            Object.keys(store.photos[currentChat.id])[0]
                        ].chat_id == currentChat.id && (
                            <div className="media-wrapper">
                                <div className="media-title">
                                    <div>
                                        <div className="image"></div>
                                        <span>
                                            MEDIA (
                                            {
                                                Object.keys(
                                                    store.photos[
                                                        currentChat?.id
                                                    ]
                                                ).length
                                            }
                                            )
                                        </span>
                                    </div>
                                    <span>Show All</span>
                                </div>

                                <div className="medias">
                                    {Object.entries(
                                        store.photos[currentChat.id]
                                    )
                                        .reverse()
                                        .map(([id, photo], index) => {
                                            if (index < 5) {
                                                return (
                                                    <div
                                                        key={id}
                                                        style={{
                                                            backgroundImage: `url(${photo.photo_url})`,
                                                        }}
                                                    ></div>
                                                );
                                            } else if (index == 5) {
                                                return (
                                                    <div
                                                        key={id}
                                                        style={{
                                                            backgroundImage: `url(${photo.photo_url})`,
                                                        }}
                                                    >
                                                        {Object.keys(
                                                            store.photos[
                                                                currentChat?.id
                                                            ]
                                                        ).length > 6 && (
                                                            <div className="overlay">
                                                                <span>
                                                                    +
                                                                    {Object.keys(
                                                                        store
                                                                            .photos[
                                                                            currentChat
                                                                                ?.id
                                                                        ]
                                                                    ).length -
                                                                        6}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            }
                                        })}
                                </div>
                            </div>
                        )}
                    <div className="chat-settings">
                        <div className="settings-title">
                            <div className="setting-icon"></div>
                            <span>Settings</span>
                        </div>
                        <div className="settings">
                            <input
                                type="file"
                                id="background"
                                name="background"
                                style={{ display: "none" }}
                                accept="image/png, image/jpeg"
                                onChange={hanleSetBackground}
                            />
                            <label htmlFor="background" id="background">
                                <span>Set background</span>
                            </label>
                            <span onClick={handleSetDefaultBackground}>
                                Set default background
                            </span>
                            <input
                                type="file"
                                id="avatar"
                                name="avatar"
                                style={{ display: "none" }}
                                accept="image/png, image/jpeg"
                                onChange={(e) => hanleSetBackground(e, true)}
                            />
                            {currentChat && currentChat.is_group && (
                                <label htmlFor="avatar" id="avatar">
                                    <span>Set avatar group</span>
                                </label>
                            )}
                            {currentChat?.is_group && (
                                <span
                                    onClick={(e) => {
                                        setInputName(name);
                                        setGroupNameToggle((pre) => !pre);
                                    }}
                                >
                                    Set group name
                                    {groupNameToggle && (
                                        <input
                                            onKeyDown={hanleSetName}
                                            onClick={(e) => e.stopPropagation()}
                                            value={inputName}
                                            onChange={(e) =>
                                                setInputName(e.target.value)
                                            }
                                        />
                                    )}
                                </span>
                            )}
                            {currentChat?.is_group && (
                                <span onClick={() => setSearchUserToggle(true)}>
                                    Add member
                                    {searchUserToggle && (
                                        <div className="add_member-wrapper">
                                            <input
                                                placeholder="Search friend..."
                                                onKeyDown={(e) =>
                                                    hanldeSearchUser(
                                                        e,
                                                        currentChat
                                                    )
                                                }
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                                value={inputSearchUser}
                                                onChange={(e) =>
                                                    setInputSearchUser(
                                                        e.target.value
                                                    )
                                                }
                                            />
                                            <span
                                                className="x-symbol"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSearchUserToggle(false);
                                                }}
                                            >
                                                ✗
                                            </span>
                                            {searched && (
                                                <div
                                                    className={
                                                        "friends add-user"
                                                    }
                                                >
                                                    {(friends?.length > 0 &&
                                                        friends.map(
                                                            (friend) => {
                                                                return (
                                                                    <div
                                                                        className="friend"
                                                                        key={
                                                                            friend.user_id
                                                                        }
                                                                        onClick={() => {
                                                                            handleAddAndRemove(
                                                                                friend.user_id
                                                                            );
                                                                        }}
                                                                    >
                                                                        <div
                                                                            className="avatar"
                                                                            style={{
                                                                                backgroundImage: `url(${friend.avatar_url})`,
                                                                            }}
                                                                        ></div>
                                                                        <span
                                                                            className={
                                                                                "friend_name add-icon"
                                                                            }
                                                                        >
                                                                            {
                                                                                friend.display_name
                                                                            }
                                                                        </span>
                                                                        <img
                                                                            className="group-icon"
                                                                            src={
                                                                                (usersAdded.includes(
                                                                                    friend.user_id
                                                                                ) &&
                                                                                    RemoveUser) ||
                                                                                AddUser
                                                                            }
                                                                        />
                                                                    </div>
                                                                );
                                                            }
                                                        )) || (
                                                        <span className="not-found">
                                                            User not found!
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {searched &&
                                                friends?.length > 0 && (
                                                    <div className="add-action">
                                                        <button
                                                            onClick={() =>
                                                                setUserAdded([])
                                                            }
                                                        >
                                                            Clear
                                                        </button>
                                                        <button
                                                            onClick={
                                                                handleAddMembers
                                                            }
                                                        >
                                                            Add members
                                                        </button>
                                                    </div>
                                                )}
                                        </div>
                                    )}
                                </span>
                            )}
                            {currentChat && !currentChat.is_group && (
                                <span
                                    onClick={() =>
                                        handleDeleteChat(currentChat)
                                    }
                                >
                                    Delete chat
                                </span>
                            )}
                        </div>
                        {currentChat && currentChat.is_group && (
                            <div className="leave-wrapper">
                                <button
                                    onClick={() => {
                                        handleLeaveGroup(currentChat);
                                    }}
                                    className="leave-btn"
                                >
                                    Leave group
                                </button>
                            </div>
                        )}
                        {currentChat &&
                            currentChat.is_group &&
                            store.chats[currentChat.id].admins.includes(
                                currentUser?.user_id
                            ) && (
                                <div className="leave-wrapper">
                                    <button
                                        onClick={() =>
                                            handleDeleteChat(currentChat)
                                        }
                                        className="leave-btn"
                                    >
                                        Delete group
                                    </button>
                                </div>
                            )}
                    </div>
                </div>
                {loading && (
                    <div className="loading-wrapper">
                        <img src={Loading} />
                    </div>
                )}
                {loadingError && (
                    <div className="loading-wrapper">
                        <img src={catLoading} />
                        <h3>Something went wrong! Please try again.</h3>
                    </div>
                )}
            </div>
        )
    );
}

export default ChatInfo;
