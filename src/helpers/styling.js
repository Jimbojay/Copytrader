// Define custom styles
const styleSelectBox = {
    control: (base) => ({
        ...base,
        width: 300, // Set the width of the selection box to 300px
        // Add any other style customizations here
    }),
    option: (provided, state) => ({
        ...provided,
        color: state.isSelected ? 'red' : 'black', // Adjust colors as needed
        backgroundColor: state.isSelected ? 'darkgray' : 'white', // Optional: change background color as well
    }),
    // You can also customize other parts of the dropdown, for example:
    // This changes the background color of the control (the input field)
    control: (provided) => ({
        ...provided,
        backgroundColor: 'white', // Example for dark theme background
        color: 'red' // Example for light font color in the input
    }),
    // This changes the color of the single value (selected item)
    singleValue: (provided) => ({
            ...provided,
            color: 'green', // Example for light font color
    }),
};

export default styleSelectBox;
