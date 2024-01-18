import React from 'react';
import Button from 'plaid-threads/Button';

const PLAID_ENV = process.env.REACT_APP_PLAID_ENV;

interface Props {
  initialSubheading?: boolean;
}

const Banner = (props: Props) => {
  return (
    <div id="banner" className="bottom-border-content">
      <div className="header">
        <h2 className="everpresent-content__heading">Mint</h2>
      </div>
    </div>
  );
};

export default Banner;
