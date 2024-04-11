import { Link } from 'react-router-dom';

interface Props {
  initialSubheading?: boolean;
}

const Banner = (props: Props) => {
  return (
    <div id="banner" className="bottom-border-content">
      <div className="header">
        <h2 className="everpresent-content__heading">ST Finance</h2>
        <nav>
          <ul>
            <li>
              <Link to="/Settings">Settings</Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Banner;
