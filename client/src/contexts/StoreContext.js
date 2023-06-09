import { createContext, useReducer } from "react";

const chats = {
    // id: {
    //     id: "",
    //     name: "",
    //     is_group: "",
    //     chat_avatar: "",
    //     members: [],
    //     admins: "",
    //     last_message: "",
    //     background_image: "",
    //     updated_at: "",
    // },
};

const hidden_chats = {
    // id: {
    //     id: "",
    //     name: "",
    //     is_group: "",
    //     chat_avatar: "",
    //     members: [],
    //     admins: "",
    //     last_message: "",
    //     background_image: "",
    //     updated_at: "",
    // },
};

const messages = {
    // chat_id: {
    //     id: {
    //         id: "",
    //         chat_id: "",
    //         sender: "",
    //         text: "",
    //         photo_url: "",
    //         file_url: "",
    //         recall: false,
    //         background_image: null,
    //         created_at: "",
    //     },
    // },
};

const users = {
    // id: {
    //     user_id: "",
    //     display_name: "",
    //     avatar_url: "",
    // },
};

const photos = {
    // chat_id: {
    //     id :{
    //         id: "",
    //         photo_url: "",
    //         chat_id: "",
    //         created_at: "",
    //     }
    // }
};

let initialStore = {
    chats,
    messages,
    users,
    photos,
    hidden_chats,
};

const reducer = (state = initialStore, action) => {
    switch (action.type) {
        case "ADD_MESSAGE": {
            return (initialStore = {
                ...state,
                messages: {
                    ...state.messages,
                    [action.message.chat_id]: state.messages[
                        action.message.chat_id
                    ]
                        ? {
                              ...state.messages[action.message.chat_id],
                              [action.message.id]: action.message,
                          }
                        : { [action.message.id]: action.message },
                },
            });
        }
        case "RECALL_MESSAGE": {
            return (initialStore = {
                ...state,
                messages: {
                    ...state.messages,
                    [action.message.chat_id]: {
                        ...action.message.chat_id,
                        text: null,
                        photo_url: null,
                        file_url: null,
                        recall: true,
                    },
                },
            });
        }
        case "ADD_USERS": {
            return (initialStore = {
                ...state,
                users: { ...state.users, ...action.users },
            });
        }
        case "REMOVE_USER": {
            delete state.users[action.user_id];
            return (initialStore = state);
        }
        case "ADD_CHATS": {
            return (initialStore = {
                ...state,
                chats: { ...state.chats, ...action.chats },
            });
        }
        case "REMOVE_CHAT": {
            delete state.chats[action.chat_id];
            return (initialStore = state);
        }
        case "LEAVE_GROUP": {
            delete state.chats[action.chat_id];
            return (initialStore = state);
        }
        case "ADD_HIDDEN_CHATS": {
            return (initialStore = {
                ...state,
                hidden_chats: { ...state.hidden_chats, ...action.hidden_chats },
            });
        }
        case "HIDDEN_CHAT": {
            state.hidden_chats[action.chat_id] = state.chats[action.chat_id];
            delete state.chats[action.chat_id];
            return {
                ...state,
            };
        }
        case "DISPLAY_CHAT": {
            state.chats[action.chat_id] = state.hidden_chats[action.chat_id];
            delete state.hidden_chats[action.chat_id];
            console.log(state);
            return {
                ...state,
            };
        }
        case "ADD_MESSAGES": {
            let messages = state.messages;
            for (const message of action.messages) {
                messages = {
                    ...messages,
                    [message.chat_id]: messages[message.chat_id]
                        ? {
                              ...messages[message.chat_id],
                              [message.id]: message,
                          }
                        : { [message.id]: message },
                };
            }

            return (initialStore = {
                ...state,
                messages,
            });
        }
        case "ADD_PHOTO": {
            return (initialStore = {
                ...state,
                photos: {
                    ...state.photos,
                    [action.photo.chat_id]: state.photos[action.photo.chat_id]
                        ? {
                              ...state.photos[action.photo.chat_id],
                              [action.photo.id]: action.photo,
                          }
                        : { [action.photo.id]: action.photo },
                },
            });
        }
        case "ADD_PHOTOS": {
            let photos = state.photos;
            if (!action.photos) return state;
            for (const photo of action.photos) {
                photos = {
                    ...photos,
                    [photo.chat_id]: photos[photo.chat_id]
                        ? {
                              ...photos[photo.chat_id],
                              [photo.id]: photo,
                          }
                        : { [photo.id]: photo },
                };
            }
            return (initialStore = {
                ...state,
                photos: { ...photos },
            });
        }
        case "ADD_MESSAGE_DONE": {
            delete state.messages[action.message.chat_id][action.id];
            return (initialStore = {
                ...state,
                messages: {
                    ...state.messages,
                    [action.message.chat_id]: {
                        ...state.messages[action.message.chat_id],
                        [action.message.id]: action.message,
                    },
                },
            });
        }
        case "REMOVE_MESSAGE_FAILURE": {
            delete state.messages[action.message.chat_id][action.id];
            return (initialStore = {
                ...state,
            });
        }
        case "ADD_FRIENDS": {
            return (initialStore = {
                ...state,
                friends: {
                    [action.user_id]: state.friends
                        ? {
                              ...state.friends[action.user_id],
                              ...action.friends,
                          }
                        : { ...action.friends },
                },
            });
        }
        case "REMOVE_FRIEND": {
            delete state.friends[action.user_id][action.friend_id];
            return (initialStore = {
                ...state,
            });
        }
        case "ADD_FRIENDS_ONLINE": {
            return (initialStore = {
                ...state,
                friends_online: {
                    [action?.user_id]:
                        state.friends_online &&
                        state.friends_online[action?.user_id]
                            ? [
                                  ...state.friends_online[action?.user_id],
                                  ...action.friends_online,
                              ]
                            : action.friends_online,
                },
            });
        }
        case "FRIEND_OFF": {
            const friends_online = state.friends_online[action.user_id]?.filter(
                (friend) => friend != action.friend_off
            );
            return (initialStore = {
                ...state,
                friends_online: {
                    [action.user_id]: [...friends_online],
                },
            });
        }
        default:
            return (initialStore = state);
    }
};

const sortChats = (chats) => {
    let objsort = {};
    Object.entries(chats).forEach(([key, value]) => {
        objsort[value.updated_at] = key;
    });
    return Object.entries(objsort).sort();
};

const sortFriends = (friends) => {
    return Object.entries(friends)
        .map(([key, value]) => [value.status, key])
        .sort()
        .reverse()
        .map(([value, key]) => key);
};

export const StoreContext = createContext();

export const StoreContextProvider = ({ children }) => {
    const [store, dispatch] = useReducer(reducer, initialStore);
    return (
        <StoreContext.Provider
            value={{
                store,
                dispatch,
                sortChats,
                sortFriends,
            }}
        >
            {children}
        </StoreContext.Provider>
    );
};
