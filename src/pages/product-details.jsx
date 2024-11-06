/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Box, Container, Grid, Typography, FormControl, Select, MenuItem, Button, CircularProgress, Backdrop } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import NoImage from '../assets/no-image.png';
import { ServerURL } from '../server/serverUrl';
import { ImagePathRoutes } from '../routes/ImagePathRoutes';
import { API_FetchProductById } from '../services/productListServices';
import RelatedProducts from '../components/slider/relatedProducts';
import BreadCrumbs from '../components/BreadCrumbs';
import { API_InsertMyFavoriteProducts, API_FetchMyFavoriteProducts, API_DeleteMyFavoriteProducts } from '../services/userServices';
import { useCart } from '../context/CartContext';
import { useTheme } from '@mui/material/styles';
import { connect } from 'react-redux';
import * as actionType from '../redux/actionType';

const ProductDetails = (props) => {
    const theme = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const [productId, setProductId] = useState(0);
    const [quantity, setQuantity] = useState(0);
    const [totalPrice, setTotalPrice] = useState(0);
    const [productDetails, setProductDetails] = useState({});
    const [imageLists, setImageLists] = useState([]);
    const [loading, setLoading] = useState(false);
    const [backdropOpen, setBackdropOpen] = useState(false);
    const { cartItems, setCartItems } = useCart();
    const [productValue, setProductValue] = useState(0);
    let [isFavoriteProduct, setIsFavoriteProduct] = useState(0);

    const [productWeight, setProductWeight] = useState('');
    const [selectedPrice, setSelectedPrice] = useState(0);
    const [selectedMRP, setselectedMRP] = useState(0);
    const [currentPrice, setCurrentPrice] = useState(0);

    const GetProductDetails = async (productId) => {
        try {
            setLoading(true);
            setBackdropOpen(true);
            const fetchedProductDetails = await API_FetchProductById(productId);
            if (Array.isArray(fetchedProductDetails) && fetchedProductDetails.length > 0) {
                const product = fetchedProductDetails[0];
                setProductDetails(product);
                setTotalPrice(product.Price);

                // Filter and flatten the image list
                const images = [product.Img0, product.Img1, product.Img2]
                    .filter(img => img && img !== "Undefined.jpg" && img !== "Undefined.png");
                setImageLists(images);

                //Fav product load
                const selectedFavList = props.get_fav_lists.find(item => item.Id === Number(productId));
                if (selectedFavList !== undefined && selectedFavList.length !== 0) {
                    setIsFavoriteProduct(1);
                }
                else {
                    setIsFavoriteProduct(0);
                }

            } else {
                setProductDetails({});
                setImageLists([]);
            }
        } catch (error) {
            console.error("Error fetching product details:", error);
            setProductDetails({});
            setImageLists([]);
        } finally {
            setLoading(false);
            setBackdropOpen(false);
        }
    };

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const encodedId = queryParams.get('pdid');
        const productId = encodedId ? decodeURIComponent(encodedId) : null;
        setProductId(atob(productId));
        if (productId) {
            GetProductDetails(atob(productId));           
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.search, props.get_fav_lists]);

    const handleProductWeightChange = (event, ProductWeightLists) => {
        event.stopPropagation();

        const selectedWeightId = event.target.value;
        const selectedWeight = ProductWeightLists.find(item => item.WeightType === selectedWeightId);
        if (selectedWeight) {
            setProductWeight(selectedWeight.WeightType);
            setTotalPrice(selectedWeight.SaleRate);
            setSelectedPrice(selectedWeight.SaleRate);
            setCurrentPrice(selectedWeight.SaleRate);
            setselectedMRP(selectedWeight.MRP);

            const newTotalPrice = quantity * (selectedWeight.SaleRate);
            const newMRP = quantity * (selectedWeight.MRP);
            updateCartItems(quantity, newTotalPrice, newMRP, selectedWeight.SaleRate);
        }
    };

    useEffect(() => {
        if (productDetails && productDetails.ProductWeightType && productDetails.ProductWeightType.length > 0) {
            const firstWeight = productDetails.ProductWeightType[0];
            if (firstWeight && firstWeight.WeightType) {
                setProductWeight(firstWeight.WeightType);
            }
        }
    }, [productDetails]);


    // Check if the product exists in cartItems
    useEffect(() => {
        const existingProduct = cartItems.find(item => {
            const itemId = item?.Productid ? item.Productid : item?.Id;
            const productId = productDetails?.Productid ? productDetails.Productid : productDetails?.Id;
            return itemId === productId;
        });

        if (existingProduct) {
            setQuantity(existingProduct.item);
            setTotalPrice(existingProduct.totalPrice);
            setCurrentPrice(existingProduct.totalPrice);
        } else {
            setQuantity(0);
            setTotalPrice(productDetails?.Price || 0);
            setCurrentPrice(selectedPrice > 0 ? selectedPrice : productDetails?.Price || 0);
        }
    }, [cartItems, productDetails, selectedPrice]);

    // Update cartItems function
    const updateCartItems = (newQuantity, newTotalPrice, MRP, selected_price) => {
        setCartItems(prevCartItems => {
            const updatedCartItems = [...prevCartItems];
            const productId = productDetails?.Productid ? productDetails.Productid : productDetails?.Id;

            const existingProductIndex = updatedCartItems.findIndex(item => {
                const itemId = item?.Productid ? item.Productid : item?.Id;
                return itemId === productId;
            });

            if (existingProductIndex >= 0) {
                if (newQuantity > 0) {
                    // Update existing product in the cart
                    updatedCartItems[existingProductIndex] = {
                        ...updatedCartItems[existingProductIndex],
                        item: newQuantity,
                        totalPrice: newTotalPrice,
                        totalMRP: MRP,
                        selectedPrice: selected_price,
                        selectedMRP: MRP
                    };
                } else {
                    // Remove product if the quantity is zero
                    updatedCartItems.splice(existingProductIndex, 1);
                }
            } else if (newQuantity > 0) {
                // Add new product to the cart
                updatedCartItems.push({
                    ...productDetails,
                    item: newQuantity,
                    totalPrice: newTotalPrice,
                    totalMRP: MRP,
                    selectedPrice: selected_price,
                    selectedMRP: MRP
                });
            }

            localStorage.setItem('cartItems', JSON.stringify(updatedCartItems));
            return updatedCartItems;
        });
    };


    // Quantity increment function
    const handleIncrement = (event) => {
        event.stopPropagation();
        const newQuantity = quantity + 1;
        const newTotalPrice = newQuantity * (selectedPrice > 0 ? selectedPrice : productDetails.Price);
        const MRP = newQuantity * (selectedMRP > 0 ? selectedMRP : productDetails.MRP);

        setQuantity(newQuantity);
        setTotalPrice(newTotalPrice);
        setCurrentPrice(newTotalPrice);
        updateCartItems(newQuantity, newTotalPrice, MRP);
    };

    // Quantity decrement function
    const handleDecrement = (event) => {
        event.stopPropagation();
        const newQuantity = quantity - 1;
        const newTotalPrice = newQuantity * (selectedPrice > 0 ? selectedPrice : productDetails.Price);
        const MRP = newQuantity * (selectedMRP > 0 ? selectedMRP : productDetails.MRP);

        if (newQuantity === 0) {
            setQuantity(0);
            setTotalPrice(selectedPrice > 0 ? selectedPrice : productDetails.Price);
            updateCartItems(0, selectedPrice > 0 ? selectedPrice : productDetails.Price, MRP);
        } else if (quantity > 0) {
            setQuantity(newQuantity);
            setTotalPrice(newTotalPrice);
            setCurrentPrice(newTotalPrice);
            updateCartItems(newQuantity, newTotalPrice, MRP);
        }
    };

    //Add fav product
  const handleAddFavProduct = async (ProductId, event, status) => {
    event.stopPropagation();
    setIsFavoriteProduct(1);
    let userId = localStorage.getItem("userId");
    userId = userId ? decodeURIComponent(userId) : null;
    try {
      const response = await API_InsertMyFavoriteProducts(ProductId,  Number(atob(userId)));
      if (response.DeleteStatus === 0 && response.ItemmasterRefid !== 0) {
        await FetchMyFavoriteProducts(atob(userId));
        setIsFavoriteProduct(1);
      }
      else{
        setIsFavoriteProduct(0);
      }
    } catch (error) {
      setIsFavoriteProduct(0);
    }
  };

  const FetchMyFavoriteProducts = async (userId) => {
    try {
        const favlist = await API_FetchMyFavoriteProducts(userId);
        if(favlist !== undefined && favlist.length !== 0){
          props.setFavouriteLists(favlist);
        }        
    } catch (error) {
        console.error("Error fetching favorite product lists:", error);
    }
};

  //Remove fav list
  const handleRemoveFavProduct = async (ProductId, event) => {
    event.stopPropagation();
    let userId = localStorage.getItem("userId");
    userId = userId ? decodeURIComponent(userId) : null;
    try {
      const response = await API_DeleteMyFavoriteProducts(ProductId, Number(atob(userId)));
      if (response.DeleteStatus === 1 && response.ItemmasterRefid !== 0) {
        await FetchMyFavoriteProducts(atob(userId));
        setIsFavoriteProduct(0);
      }
    } catch (error) {
      setIsFavoriteProduct(1);
    }
  };
    // Slick Slider settings
    const settings1 = {
        customPaging: function (index) {
            return (
                <img style={{ width: '80px !important', height: '80px', objectFit: 'cover' }} src={imageLists[index] === '/productimages/Undefined.jpg' || imageLists[index] === '/productimages/Undefined.png' || imageLists[index] === null || imageLists[index] === '' ? NoImage : ImagePathRoutes.ProductImagePath + imageLists[index]} alt={imageLists[index] === '/productimages/Undefined.jpg' || imageLists[index] === '/productimages/Undefined.png' || "Product name is not available" + index + 1} />
            );
        },
        dots: true,
        dotsClass: "slick-dots slick-thumb",
        infinite: true,
        arrows: false,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1
    };

    return (
        <>
            <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={backdropOpen}>
                <CircularProgress color="inherit" />
            </Backdrop>
            <Box className="card-wrapper" sx={{ maxWidth: '100%', mx: 'auto', p: 2 }}>
                <Box sx={{ display: 'block', justifyContent: 'space-between' }}>
                    {/* Card Left - Image Slider */}
                    <Box className="product-imgs" sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', }}>

                    </Box>

                    {/* Card Right - Product Content */}

                </Box>
            </Box>
            <Container maxWidth="lg" sx={{ my: 3 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={5}>
                        <Slider {...settings1}>
                            {imageLists.map((image, index) => (
                                <img style={{ width: '100%', height: '100px' }} src={ImagePathRoutes.ProductImagePath + image === '/productimages/Undefined.jpg' || ImagePathRoutes.ProductImagePath + image === '/productimages/Undefined.png' || ImagePathRoutes.ProductImagePath + image === null || ImagePathRoutes.ProductImagePath + image === '' ? NoImage : ImagePathRoutes.ProductImagePath + image} alt={productDetails.Description || "Product name is not available" + index + 1} />
                            ))}
                        </Slider>
                    </Grid>
                    <Grid item xs={12} sm={7}>
                        <Box>
                            <Box sx={{ pb: 1 }}><BreadCrumbs CategoryId={productDetails.CId} CategoryName={productDetails.CategoryName} SubCateoryId={productDetails.SId} SubCategoryName={productDetails.SubCategoryName} ProductName={productDetails.Description} /></Box>
                            <Typography component={"h4"} sx={{ fontSize: 20, fontWeight: 600, fontFamily: "inherit", textAlign: "left", pb: 1.5 }}>
                                {productDetails.Description || "Product name is not available"}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '100px', pb: 1 }}>
                                {Math.round(productDetails.Offer) === 0 && (
                                    <Typography sx={{
                                        position: 'relative',
                                        left: '8px',
                                        backgroundColor: '#fff6e0',
                                        color: '#5d3e03',
                                        padding: '2px 5px',
                                        borderRadius: '3px',
                                        border: '1px solid #90784159',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        fontFamily: 'inherit',
                                        display: 'block'
                                    }}>
                                        {Math.round(productDetails.Offer)}% OFF
                                    </Typography>
                                )}
                                <Box sx={{
                                    position: 'relative',
                                    cursor: 'pointer',
                                    color: productDetails.isFavorite ? '#3BB77E' : '#3BB77E',
                                }}>
                                    {isFavoriteProduct !== 0 ? <FavoriteIcon size="small" sx={{ color: '#ee4372', fontSize: '18px' }} onClick={(event) => { handleRemoveFavProduct(productDetails?.Productid ? productDetails.Productid : productDetails?.Id, event); }} /> : <FavoriteBorderIcon onClick={(event) => { handleAddFavProduct(productDetails?.Productid ? productDetails.Productid : productDetails?.Id, event, 'Add'); }} size="small" sx={{ color: '#ee4372', fontSize: '18px' }} />}
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', pb: 2 }}>
                                <Typography variant="body2" sx={{ color: '#253D4E', fontSize: '14px', lineHeight: '24px', fontFamily: 'inherit' }}>
                                    {productDetails.MultiplePriceEnable === 0 ? productDetails.UnitType :
                                        <Box sx={{ minWidth: 75, p: 0 }}>
                                            <FormControl fullWidth sx={{ p: 0, border: 'none' }}>
                                                <Select
                                                    sx={{
                                                        height: '30px',
                                                        border: '1px dotted #999',
                                                        '& .MuiOutlinedInput-notchedOutline': {
                                                            border: 'none',
                                                        },
                                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                                            border: 'none',
                                                        },
                                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                            border: 'none',
                                                        },
                                                    }}
                                                    size="small"
                                                    labelId="demo-simple-select-label-multi"
                                                    id="demo-simple-select-multi"
                                                    value={productWeight}
                                                    onChange={(e) => handleProductWeightChange(e, productDetails.ProductWeightType)}
                                                >
                                                    {productDetails.ProductWeightType && productDetails.ProductWeightType.length !== 0 ? (
                                                        productDetails.ProductWeightType.map((weight, index) => (
                                                            <MenuItem sx={{ px: 1, py: 0 }} key={index} name={weight.Id} value={weight.WeightType}>
                                                                {weight.WeightType}
                                                            </MenuItem>
                                                        ))
                                                    ) : (
                                                        <></>
                                                    )}
                                                </Select>
                                            </FormControl>
                                        </Box>
                                    }
                                </Typography>
                            </Box>
                            <Box sx={{ pb: 2, display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '30px' }}>
                                <Typography variant="body2" sx={{ color: '#253D4E', fontSize: '16px', lineHeight: '30px', fontFamily: 'inherit', textAlign: 'left' }}>
                                    {(currentPrice > 0 ? currentPrice : totalPrice).toLocaleString('en-IN', { style: 'currency', currency: ServerURL.CURRENCY, minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </Typography>
                                {productDetails.MRP && (
                                    <Typography variant="body2" sx={{ textDecoration: 'line-through', fontSize: '14px', fontWeight: 200, color: '#a3a4ae', fontFamily: 'inherit', textAlign: 'left' }}>
                                        {'MRP:' + ((selectedMRP > 0 ? selectedMRP : productDetails.MRP)).toLocaleString('en-IN', { style: 'currency', currency: ServerURL.CURRENCY, minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </Typography>
                                )}
                            </Box>
                            <Button
                                variant="outlined"
                                sx={{
                                    width: "20%",
                                    display: quantity !== 0 ? 'flex' : 'none',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginTop: '10px',
                                    fontFamily: 'inherit',
                                    border: '1px solid',
                                    borderColor: theme.palette.basecolorCode.main,
                                    padding: { xs: '6px 0px', sm: '7px 0px', md: '7.2px 0px' },
                                    '&:hover': {
                                        background: 'none',
                                        border: '1px solid',
                                        borderColor: theme.palette.basecolorCode.main,
                                        color: theme.palette.basecolorCode.main
                                    }
                                }}
                            >
                                <Typography
                                    variant="body2"
                                    onClick={(e) => { handleDecrement(e); }}
                                    sx={{
                                        width: '25%',
                                        color: theme.palette.basecolorCode.main,
                                        fontFamily: 'inherit',
                                    }}
                                >
                                    -
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        width: '50%',
                                        color: theme.palette.basecolorCode.main,
                                        fontFamily: 'inherit',
                                    }}
                                >
                                    {quantity}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    id={productDetails?.Productid ? productDetails.Productid : productDetails?.Id}
                                    name={productDetails.Description}
                                    value={productDetails?.Productid ? productDetails.Productid : productDetails?.Id}
                                    onClick={(e) => { handleIncrement(e); }}
                                    sx={{
                                        width: '25%',
                                        color: theme.palette.basecolorCode.main,
                                        fontFamily: 'inherit',
                                    }}
                                >
                                    +
                                </Typography>
                            </Button>
                            {productDetails.InStock !== 0 ?
                                <Button
                                    variant="outlined"
                                    sx={{
                                        display: quantity === 0 ? 'block' : 'none',
                                        marginTop: '10px',
                                        width: { xs: 'auto', sm: 'auto', md: "30%", lg: "20%" },
                                        textTransform: 'none',
                                        fontFamily: 'inherit',
                                        fontWeight: 600,
                                        borderColor: theme.palette.basecolorCode.main,
                                        backgroundColor: theme.palette.shadowcolorCode.main,
                                        color: theme.palette.basecolorCode.main,
                                        '&:hover': {
                                            background: 'none',
                                            border: '1px solid',
                                            borderColor: theme.palette.basecolorCode.main,
                                            color: theme.palette.basecolorCode.main,
                                        }
                                    }}
                                    onClick={(e) => { handleIncrement(e); }}
                                >
                                    Add to Cart
                                </Button>
                                :
                                <Button
                                    variant="outlined"
                                    sx={{
                                        marginTop: '10px',
                                        width: 'auto',
                                        float: 'left',
                                        textTransform: 'none',
                                        fontFamily: 'inherit',
                                        border: '1px solid #dc3545',
                                        backgroundColor: '#dc3545',
                                        color: '#fff',
                                        '&:hover': {
                                            background: '#dc3545',
                                            border: '1px solid #dc3545',
                                            color: '#fff'
                                        }
                                    }}
                                >
                                    Out of Stock
                                </Button>
                            }
                        </Box>
                        <Box sx={{ pb: 4, pt: 6.5 }}>
                            <Typography sx={{ fontSize: 18, fontWeight: 600, textAlign: 'left', pb: 1 }}>About Product</Typography>
                            <Typography component={'p'} sx={{ color: '#2b1e3580', textAlign: 'left', fontSize: 16 }}>
                                {productDetails.ProductDescription ? productDetails.ProductDescription
                                    :
                                    `Lorem ipsum dolor sit, amet consectetur adipisicing elit. Corrupti
                                repellendus tenetur reiciendis magnam quae accusamus repellat debitis
                                laboriosam error labore! Aperiam praesentium nisi quidem molestiae unde
                                architecto quam adipisci ut!
                                Lorem ipsum dolor sit, amet consectetur adipisicing elit. Corrupti
                                repellendus tenetur reiciendis magnam quae accusamus repellat debitis
                                laboriosam error labore! Aperiam praesentium nisi quidem molestiae unde
                                architecto quam adipisci ut!`
                                }
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Container>
            <Container maxWidth="xl">
                <Box sx={{ width: "100%", display: "inline-block" }}>
                    <RelatedProducts ProductId={productId} />
                </Box>
            </Container>
        </>
    );
};


const mapStateToProps = (state) => {
    return {
      get_fav_lists: state.get_fav_lists, // Get favourite lists from Redux state (Wishlists)
    };
};

const mapDispatchToProps = (dispatch) => {
    return {    
      setFavouriteLists: (data) => dispatch({type: actionType.GET_GLOBAL_FAVOURITE_LISTS, payload: data})
    };
  };
  
export default connect(mapStateToProps, mapDispatchToProps)(ProductDetails);