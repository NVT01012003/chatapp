import "./styles/form.scss";
import Contact from "../imgs/contact.png";
import { useContext, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../config/firebase/firebase";
import axios from "axios";
import { registerRoute } from "../config/apiRoute";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/authContext.js";

import Loading from "../imgs/Loading.gif";

function Register() {
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const notify = (message) => {
        toast(message);
    };
    const { setCurrentUser } = useContext(AuthContext);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const email = e.target[0].value;
        const display_name = e.target[1].value;
        const password = e.target[2].value;
        const confirm = e.target[3].value;
        const file = e.target[4].files[0];
        if (!email) return notify("Email is required!");
        else if (!display_name) return notify("Display name is required!");
        else if (display_name.length < 3)
            return notify("Display name must equal or greater than 3 letter!");
        else if (!password) return notify("Password is required!");
        else if (password.length < 3 || password.length > 8)
            return notify("Password must be between in 3 and 8 letter!");
        else if (!confirm) return notify("Password confirm is required!");
        else if (password != confirm)
            return notify("Password and password confirm are not same!");
        else if (!file) return notify("Avatar is required!");
        // upload image
        setIsLoading(true);
        const storageRef = ref(storage, email);
        const uploadTask = await uploadBytesResumable(storageRef, file);
        const avatar_url = await getDownloadURL(storageRef);
        const user_info = {
            email,
            display_name,
            password,
            avatar_url,
        };
        const { data } = await axios.post(registerRoute, user_info);
        console.log(data);
        if (data) {
            if (data.status != "success") {
                setIsLoading(false);
                if (data.message == "Email already exists")
                    return notify("Email already exists");
                return notify("Something went wrong! Please try again.");
            } else {
                setCurrentUser(user_info);
                return navigate("/messenger");
            }
        } else {
            setIsLoading(false);
            return notify("Something went wrong! Please try again.");
        }
    };

    return (
        <div className="form-container">
            <div className={`loading-wrapper ${isLoading && "display"}`}>
                <img src={Loading} />
            </div>
            <div className="form-wrapper">
                <h1 className="welcome">Welcome</h1>
                <h2 className="brand">Nvt app</h2>
                <form className="form" onSubmit={handleSubmit}>
                    <input type="email" placeholder="Enter your email..." />
                    <input
                        type="text"
                        placeholder="Enter your display name..."
                    />
                    <input
                        type="password"
                        placeholder="Enter your passowrd..."
                    />
                    <input type="password" placeholder="Confirm passowrd..." />
                    <div className="add-avatar">
                        <label htmlFor="file" className="avatar">
                            <img src={Contact} />
                            Add avatar
                        </label>
                        <input
                            style={{ display: "none" }}
                            type="file"
                            id="file"
                            name="file"
                        />
                        <div className="random-avatar">Random avatar</div>
                    </div>
                    <div>
                        <span>
                            You have an account?
                            <Link to="/login">Login.</Link>
                        </span>
                    </div>
                    <button
                        className="btn-submit"
                        type="submit"
                        disabled={isLoading}
                    >
                        Register
                    </button>
                    <ToastContainer />
                </form>
            </div>
        </div>
    );
}

export default Register;
