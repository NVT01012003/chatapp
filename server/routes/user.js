import { client } from "../db/db.config.js";
import { Router } from "express";
import {
    acceptRequest,
    addFriend,
    displayChat,
    getAllFriends,
    getPublicInfo,
    getUsers,
    hiddenChat,
    refuseRequest,
    removeChat,
    searchUsers,
    updatePublicInfo,
} from "../controllers/user.js";
import { handleError } from "../helpers/handleError.js";
import {
    checkUserOauth,
    deleteUser,
    getPrivateInfo,
    updateEmail,
    updatePassword,
    updateRefreshToken,
} from "../controllers/auth.js";
import { getAllMembers, getChats, removeMember } from "../controllers/chat.js";
import { getLastMessages, getLastNotices } from "../controllers/message.js";
import { email_validator } from "../helpers/validate.js";
import { comparePassword } from "../controllers/hash.js";

export const userRouter = Router();

userRouter.get("/get_publicInfo/:id", async (req, res) => {
    try {
        const user_id = req.params.id;
        const publicInfo = await getPublicInfo(client, { user_id });
        res.status(200).json({
            code: 200,
            status: "success",
            elements: publicInfo,
        });
    } catch (e) {
        return handleError(e, res);
    }
});

userRouter.put("/update_publicInfo/:id", async (req, res) => {
    try {
        const { user_id } = req.user;
        const id_req = req.params.id;
        if (user_id != id_req)
            throw new Error("User can only update public info your account");
        const { display_name, avatar_url } = req.body;
        const publicInfo = await updatePublicInfo(client, {
            user_id,
            display_name,
            avatar_url,
        });
        res.status(200).json({
            code: 200,
            status: "success",
            elements: publicInfo,
        });
    } catch (e) {
        return handleError(e, res);
    }
});

userRouter.get("/get_privateInfo/:id", async (req, res) => {
    try {
        const req_id = req.params.id;
        const { user_id } = req.user;
        if (user_id != req_id)
            throw new Error("User can only get private info your account");
        const privateInfo = await getPrivateInfo(client, { id: user_id });

        res.status(200).json({
            code: 200,
            status: "success",
            elements: { email: privateInfo.email },
        });
    } catch (e) {
        return handleError(e, res);
    }
});

userRouter.put("/update_email/:id", async (req, res) => {
    try {
        const req_id = req.params.id;
        const { user_id } = req.user;
        if (req_id != user_id)
            throw new Error("User can only be update your account");
        const { new_email } = req.body;
        if (!new_email) throw new Error(`Invalid email`);
        const check = await checkUserOauth(client, { user_id });
        const { value, error } = email_validator.validate({ email: new_email });
        if (error) {
            res.status(200).json({
                code: 200,
                status: "Email invalid!",
            });
        } else {
            if (!check) {
                const email = await updateEmail(client, {
                    user_id,
                    email: new_email,
                });
                res.status(200).json({
                    code: 200,
                    status: "success",
                    elements: email,
                });
            } else {
                res.status(200).json({
                    code: 200,
                    status: "can not update email provided from 3rd party",
                });
            }
        }
    } catch (e) {
        return handleError(e, res);
    }
});

userRouter.put("/update_password/:id", async (req, res) => {
    try {
        const req_id = req.params.id;
        const { user_id } = req.user;
        if (req_id != user_id)
            throw new Error("User can only update your account");
        const { password, new_password } = req.body;
        if (!password || !new_password) throw new Error(`Invalid password`);
        const privateInfo = await getPrivateInfo(client, { id: user_id });
        if (comparePassword({ password, hash: privateInfo.password })) {
            const pass_updated = await updatePassword(client, {
                user_id,
                password,
                new_password,
            });
            res.status(200).json({
                code: 200,
                status: "success",
            });
        } else {
            res.status(401).json({
                code: 401,
                status: "error",
                message: "Password is incorrect",
            });
        }
    } catch (e) {
        return handleError(e, res);
    }
});

userRouter.delete("/delete_user/:id", async (req, res) => {
    try {
        const req_id = req.params.id;
        const { user_id } = req.user;
        if (req_id != user_id)
            throw new Error("User can only delete your account");
        const { password } = req.body;
        const deleted = await deleteUser(client, { user_id, password });
        res.status(200).json({
            code: 200,
            status: "success",
        });
    } catch (e) {
        return handleError(e, res);
    }
});

//////// after

userRouter.put("/:id/hidden_chat", async (req, res) => {
    try {
        const req_id = req.params.id;
        const { user_id } = req.user;
        if (req_id != user_id)
            throw new Error("User can only delete your chat");
        const { chat_id } = req.body;
        const hidden = await hiddenChat(client, { user_id, chat_id });
        res.status(200).json({
            code: 200,
            status: "success",
        });
    } catch (e) {
        return handleError(e, res);
    }
});

userRouter.put("/:id/display_chat", async (req, res) => {
    try {
        const req_id = req.params.id;
        const { user_id } = req.user;
        if (req_id != user_id)
            throw new Error("User can only display your chat");
        const { chat_id } = req.body;
        const display = await displayChat(client, { user_id, chat_id });
        res.status(200).json({
            code: 200,
            status: "success",
        });
    } catch (e) {
        return handleError(e, res);
    }
});

userRouter.put("/:id/leave_group", async (req, res) => {
    try {
        const req_id = req.params.id;
        const { user_id } = req.user;
        if (req_id != user_id)
            throw new Error("User can only leave your group on its own");
        const { chat_id } = req.body;
        const remove = await removeChat(client, { user_id, chat_id });
        const remove_member = await removeMember(client, { user_id, chat_id });
        res.status(200).json({
            code: 200,
            status: "success",
        });
    } catch (e) {
        return handleError(e, res);
    }
});

userRouter.get("/:id/get_resource", async (req, res) => {
    try {
        const req_id = req.params.id;
        const { user_id } = req.user;
        if (req_id != user_id)
            throw new Error("User can only get your resource on its own");
        const { chats, hidden_chats } = await getChats(client, { user_id });
        const all_chat = chats
            ? hidden_chats
                ? [...chats, ...hidden_chats]
                : [...chats]
            : hidden_chats
            ? [...hidden_chats]
            : [];
        let messages_id = [];
        let members = [];
        let last_notices = [];
        for (const chat of all_chat) {
            if (!chat.last_message) last_notices.push(chat.id);
            messages_id.push(chat.last_message);
            members = [...members, ...chat.members, ...chat.members_leaved];
        }
        const membersSet = new Set(members);
        members = Array.from(membersSet);
        messages_id = messages_id.filter((e) => e);
        let messages = [];
        let users = [];
        if (messages_id.length > 0)
            messages = await getLastMessages(client, { messages_id });
        if (members.length > 0)
            users = await getUsers(client, { users_id: members });
        if (last_notices.length > 0) {
            const notices = await getLastNotices(client, {
                chats_id: last_notices,
            });
            messages = [...messages, ...notices];
        }
        const { friends, friends_info } = await getAllFriends(client, {
            user_id,
        });
        res.status(200).json({
            code: 200,
            status: "success",
            elements: {
                chats,
                messages,
                users,
                friends,
                friends_info,
                hidden_chats,
            },
        });
    } catch (e) {
        handleError(e, res);
    }
});

userRouter.get("/search_users/:display_name", async (req, res) => {
    try {
        const display_name = req.params.display_name;
        const { user_id } = req.user;
        let friends = await searchUsers(client, { display_name });
        friends = friends.filter((e) => e.user_id != user_id);
        const chat_id = req.query.chat_id;
        if (chat_id) {
            const { members } = await getAllMembers(client, { chat_id });
            friends = friends.filter((e) => !members.includes(e.user_id));
        }
        res.status(200).json({
            code: 200,
            status: "success",
            elements: friends,
        });
    } catch (e) {
        res.status(500).json({
            code: 500,
            status: "error",
            message: "Server error!",
        });
    }
});

userRouter.delete("/:id/sign_out", async (req, res) => {
    try {
        const id = req.params.id;
        const { user_id } = req.user;
        if (id == user_id) {
            const signout = await updateRefreshToken(client, {
                user_id,
                token: null,
            });
            res.clearCookie("token");
            res.status(200).json({
                code: 200,
                status: "success",
            });
        } else throw new Error();
    } catch (e) {
        res.status(500).json({
            code: 500,
            status: "error",
            message: "Server error!",
        });
    }
});

userRouter.get("/:id/get_friends", async (req, res) => {
    try {
        const id = req.params.id;
        const { user_id } = req.user;
        if (id == user_id) {
            const { friends, friends_info } = await getAllFriends(client, {
                user_id,
            });
            res.status(200).json({
                code: 200,
                status: "success",
                elements: { friends, friends_info },
            });
        } else throw new Error();
    } catch (e) {
        res.status(500).json({
            code: 500,
            status: "error",
            message: "Server error!",
        });
    }
});

userRouter.post("/:id/add_friend", async (req, res) => {
    try {
        const id = req.params.id;
        const { user_id } = req.user;
        const { friend_id } = req.body;
        if (id == user_id) {
            const friend = await addFriend(client, { user_id, friend_id });
            res.status(200).json({
                code: 200,
                status: "success",
                elements: { friend },
            });
        } else throw new Error();
    } catch (e) {
        res.status(500).json({
            code: 500,
            status: "error",
            message: "Server error!",
        });
    }
});
userRouter.delete("/:friend_id/delete", async (req, res) => {
    try {
        const friend_id = req.params.friend_id;
        const { user_id } = req.user;
        const friend = await refuseRequest(client, { user_id, friend_id });
        res.status(200).json({
            code: 200,
            status: "success",
            elements: { friend: { ...friend, status: "deleted" } },
        });
    } catch (e) {
        res.status(500).json({
            code: 500,
            status: "error",
            message: "Server error!",
        });
    }
});
userRouter.put("/:friend_id/accept", async (req, res) => {
    try {
        const friend_id = req.params.friend_id;
        const { user_id } = req.user;
        const friend = await acceptRequest(client, { user_id, friend_id });
        res.status(200).json({
            code: 200,
            status: "success",
            elements: { friend },
        });
    } catch (e) {
        res.status(500).json({
            code: 500,
            status: "error",
            message: "Server error!",
        });
    }
});
