interface Props {
  initialSubheading?: boolean;
}

const Banner = (props: Props) => {
  return (
    <div id="banner" className="bottom-border-content">
      <div className="header">
        <h2 className="everpresent-content__heading">ST Finance</h2>
      </div>
    </div>
  );
};

export default Banner;
