import React, { useEffect } from 'react';
import Button from 'plaid-threads/Button';
import { useHistory } from 'react-router-dom';

import { useCurrentUser } from '../services';
import { Login, Banner, AddUserForm } from '.';

import { useBoolean } from '../hooks';

export default function Landing() {
  const { userState, setCurrentUser } = useCurrentUser();
  const [isAdding, hideForm, toggleForm] = useBoolean(false);
  const history = useHistory();

  useEffect(() => {
    if (userState.newUser != null) {
      setCurrentUser(userState.newUser);
    }
  }, [setCurrentUser, userState.newUser]);

  return (
    <div>
      <Banner doNotShowNav />
      If you don't have an account, please click "Create Account".
      <br />
      <div className="btnsContainer">
        <Login />
        <Button className="btnWithMargin" onClick={toggleForm} centered inline>
          Create Account
        </Button>
      </div>
      {isAdding && <AddUserForm hideForm={hideForm} />}
    </div>
  );
}
