//Esta funcion se encarga de hacer la vista del login de un usuario

import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Button, Form, FormGroup, Label, Input } from 'reactstrap';
import { connect } from 'react-redux';
import { login } from '../actions/authActions';
import { clearErrors } from '../actions/errorActions';
import PropTypes from 'prop-types';
import { Redirect } from 'react-router-dom';
import { Alert } from 'reactstrap';

class Login extends Component {
    state = {
        email: '',
        password: '',
        msg: null,
    };
    
    static propTypes = {
        isAuthenticated: PropTypes.bool,
        error: PropTypes.object.isRequired,
        login: PropTypes.func.isRequired,
        clearErrors: PropTypes.func.isRequired,
    };
    
    componentDidUpdate(prevProps) {
        const { error } = this.props;
        if (error !== prevProps.error) {
        if (error.id === 'LOGIN_FAIL') {
            this.setState({ msg: error.msg.msg });
        } else {
            this.setState({ msg: null });
        }
        }
    }
    
    onChange = (e) => {
        this.setState({ [e.target.name]: e.target.value });
    };
    
    onSubmit = (e) => {
        e.preventDefault();
    
        const { email, password } = this.state;
    
        const user = {
        email,
        password,
        };
    
        this.props.login(user);
    };
    
    render() {
        if (this.props.isAuthenticated) {
        return <Redirect to="/home" />;
        }
        return (
        <div>
            <Form onSubmit={this.onSubmit}>
            <FormGroup>
                <Label for="email">Email</Label>
                <Input
                type="email"
                name="email"
                id="email"
                placeholder="Email"
                className="mb-3"
                onChange={this.onChange}
                />
                <Label for="password">Password</Label>
                <Input
                type="password"
                name="password"
                id="password"
                placeholder="Password"
                className="mb-3"
                onChange={this.onChange}
                />
                {this.state.msg ? (
                <Alert color="danger">{this.state.msg}</Alert>
                ) : null}
                <Button color="dark" style={{ marginTop: '2rem' }} block>
                Login
                </Button>
                <p>
                Don't have an account? <Link to="/register">Register</Link>
                </p>
            </FormGroup>
            </Form>
        </div>
        );
    }
}

const mapStateToProps = (state) => ({
    isAuthenticated: state.auth.isAuthenticated,
    error: state.error,
});

export default connect(mapStateToProps, { login, clearErrors })(Login);
