import StarRatings from 'react-star-ratings';

const StarRating = ({ rating, onChange }) => {
    return (
        <StarRatings
            rating={rating}
            starRatedColor="gold" // Color of selected stars
            starHoverColor="gold" // Color of stars on hover
            changeRating={onChange} // Callback for when the rating changes
            numberOfStars={5} // Total number of stars
            starDimension="26px" // Size of each star
            starSpacing="4px" // Spacing between stars
        />
    );
};

export default StarRating;