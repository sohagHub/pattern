import React, { useState } from 'react';
import Modal from 'plaid-threads/Modal';
import ModalBody from 'plaid-threads/ModalBody';
import Button from 'plaid-threads/Button';
import TextInput from 'plaid-threads/TextInput';

import { useCurrentUser } from '../services';

const Login = () => {
  const { login } = useCurrentUser();
  const [show, setShow] = useState(false);
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = () => {
    setShow(false);
    login(userName, password);
  };

  return (
    <div>
      <Button centered inline onClick={() => setShow(!show)}>
        Login
      </Button>
      <Modal isOpen={show} onRequestClose={() => setShow(false)}>
        <>
          <ModalBody
            onClickCancel={() => setShow(false)}
            header="User Login"
            isLoading={false}
            onClickConfirm={handleSubmit}
            confirmText="Submit"
          >
            <TextInput
              label=""
              id="id-6"
              placeholder="Enter User Name"
              value={userName}
              onChange={e => setUserName(e.currentTarget.value)}
            />
            <input
              className="input_login"
              id="id-7"
              placeholder="Enter Password"
              value={password}
              onChange={e => setPassword(e.currentTarget.value)}
              type="password"
            />
          </ModalBody>
        </>
      </Modal>
    </div>
  );
};

export default Login;
