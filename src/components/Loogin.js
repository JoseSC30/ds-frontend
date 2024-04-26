import React,{ useState }from "react";
import { useNavigate } from "react-router-dom";
import './Login.css';

function Login() {

    const navigate = useNavigate();

    const handleNavigation = () => {
        navigate('/');
    }

    // const [email, setEmail] = useState('');
    // const [password, setPassword] = useState('');
    
    //LOGIN
    // const [logueo, setLogueo] = useState({
    //     email: '',
    //     password: ''
    // });

    const handleChangeLogin = (event) => {
        setLogueo({
            ...logueo,
            [event.target.name]: event.target.value
        });
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        console.log(`Email: ${email}, Password: ${password}`);
    };
    return (
        <div>
            <h2>Iniciar Sesion</h2>
            <form className='form' onSubmit={handleSubmit}>
                <label>
                    Corre electronico:
                    <input
                        className='input'
                        type="email"
                        value={email}
                        // onChange={(event) => setEmail(event.target.value)}
                        // onChange={}
                        required
                    />
                </label>
                <label>
                    Contraseña:
                    <input
                    className='input'
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                    />
                </label>
                <button className='button' type="submit" onClick={handleNavigation}>
                    Iniciar Sesion
                </button>
            </form>
        </div>
    );
}

export default Login;