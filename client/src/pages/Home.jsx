import { useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/authContext";

function Home() {
    const navigate = useNavigate();
    const { currentUser, getUser, setCurrentUser } = useContext(AuthContext);
    useEffect(() => {
        (() => {
            if (Object.keys(currentUser).length == 0) {
                getUser().then((user) => {
                    if (user) setCurrentUser(user);
                    else {
                        navigate("/login");
                    }
                });
            } else if (!currentUser) {
                navigate("/login");
            }
        })();
    }, []);
    return (
        <div>
            Home
            <div>
                <Link to="/register">Register</Link>
                <Link to="/login">Login</Link>
                <Link to="/messenger">messenger</Link>
                <button
                    onClick={() => {
                        console.log(currentUser);
                    }}
                >
                    click 1234
                </button>
            </div>
        </div>
    );
}

export default Home;
