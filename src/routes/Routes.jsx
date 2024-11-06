/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useMediaQuery, useTheme } from '@mui/material';
import { AuthProvider } from '../context/authContext';
import { CartProvider } from '../context/CartContext';
import AppLayout from '../components/layouts/AppLayout';
import AppBottomNavigation from '../components/layouts/AppBottom';
import HomePage from '../pages/index';
import Categories from '../pages/categories';
import ProductList from '../pages/product-list';
import ProductDetails from '../pages/product-details';
import MyAccount from '../pages/myaccount';
import ProductCheckout from '../pages/product-checkout';
import AboutUs from '../pages/about-us';
import PrivacyPolicy from '../pages/privacy-policy';
import TermsAndConditions from '../pages/terms-and-conditions';
import RefundAndCancellation from '../pages/refund-and-cancellation';
import { API_FetchSettings } from '../services/settings';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import ThemeSettings from '../theme/theme';
import {ServerURL} from '../server/serverUrl';

function AppRouter() {
    let [themeLists, setThemeLists] = useState([]);
    const [isLoading, setIsLoading] = useState(true);    
    const theme = useTheme();    
    const isMobile = useMediaQuery(theme.breakpoints.down('sm', 'xs'));

    useEffect(() => {
    FetchMySettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const FetchMySettings = async () => {
        try {
            let objtheme = await API_FetchSettings();
            setThemeLists(objtheme.data[0]);
            ServerURL.COMPANY_ADDRESS = [objtheme.data[0].Address1, objtheme.data[0].Address2, objtheme.data[0].City, objtheme.data[0].Pincode].filter(Boolean).join(', ');
            ServerURL.COMPANY_NAME = objtheme.data[0].ShopName;
            ServerURL.COMPANY_EMAIL = objtheme.data[0].Email;
            ServerURL.COMPANY_MOBILE = objtheme.data[0].MobileNo1;            
            ServerURL.COMPANY_URL = objtheme.data[0].CompanyUrl;
            ServerURL.COMPANY_PAYMENT_RAZ_KEY = objtheme.data[0].PaymentId;
            setIsLoading(false);
        } catch (error) {
            console.error("Error fetching order lists:", error);
            setIsLoading(false);
        }
    };    

    const ThemeSettingsLists = ThemeSettings(themeLists);

    return (
        <ThemeProvider theme={ThemeSettingsLists}>
            <CssBaseline />
            <Router>
                <AuthProvider>
                    <CartProvider>
                        <AppLayout CompanyDetails={themeLists}>
                            <div className="App">
                                <Routes>
                                    <Route path="/" element={<HomePage />} />
                                    <Route path="/categories" element={<Categories />} />
                                    <Route path="/product-list" element={<ProductList />} />
                                    <Route path="/product-details" element={<ProductDetails />} />
                                    <Route path="/myaccount" element={<MyAccount />} />
                                    <Route path="/product-checkout" element={<ProductCheckout />} />
                                    <Route path="/about-us" element={<AboutUs />} />
                                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                                    <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
                                    <Route path="/refund-and-cancellation" element={<RefundAndCancellation />} />
                                    {/* Catch-all Route for 404 */}
                                    <Route path="*" element={<Navigate to="/" replace />} />
                                </Routes>
                            </div>
                        </AppLayout>
                        {isMobile && (
                            <AppBottomNavigation />
                        )}
                    </CartProvider>
                </AuthProvider>
            </Router>
        </ThemeProvider>
    )
};
export default AppRouter;