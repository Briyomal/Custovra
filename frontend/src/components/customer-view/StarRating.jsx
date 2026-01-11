import { useMediaQuery } from "react-responsive";
import StarRatings from "react-star-ratings";

const StarRating = ({ rating, onChange }) => {
  const isMobile = useMediaQuery({ maxWidth: 768 });

  return (
    <StarRatings
      rating={rating}
      starRatedColor="gold"
      starHoverColor="gold"
      changeRating={onChange}
      numberOfStars={5}
      starDimension={isMobile ? "18px" : "26px"}
      starSpacing="4px"
    />
  );
};

export default StarRating;
