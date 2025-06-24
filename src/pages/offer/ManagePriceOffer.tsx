import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
// import { useAccount, useMsal } from '@azure/msal-react';
import { Typography, Box, Skeleton } from '@mui/material';
import { useTranslation } from 'react-i18next';
import PriceOffer from '../../components/offer/PriceOffer';
import { getQuoteOffer } from '../../api/client/offer';

const ManagePriceOffer = () => {
	const { t } = useTranslation();

	const [offer, setOffer] = useState<any>(null);
	const [offerNumber, setOfferNumber] = useState<string>("");
	// const [content, setContent] = useState<string>("");
	const [options, setOptions] = useState<any>(null);
	const [files, setFiles] = useState<any>(null);
	
	let { id } = useParams();
	// const { accounts } = useMsal();
	// const account = useAccount(accounts[0] || {});
	
	useEffect(() => {
		loadOffer();
	}, []);

	const loadOffer = async () => {
		try {
			const response: any = await getQuoteOffer({path: {id: id || ""}});
			if (response !== null && response !== undefined) {
				console.log(response.data.data);
				var objTotal = response.data.data;
				setFiles(objTotal.files);
				setOptions(objTotal.options);
				setOffer(response.data.data);
				setOfferNumber(response.data.data.quoteOfferNumber);
				
				// var optionsButtons = response.data.options.map((_: any, index: number) => {
				// 	return `<a href="#" style="display:inline-block;background-color:#008089;color:#fff;padding:10px 20px;text-decoration:none" target="_blank">${t('selectOptionOffer')} #${Number(index+1)}</a>`;
				// });
				// var footer = `
				// <div>${account?.name}</div>
				// <div style="font-family: Verdana; padding-top: 30px; padding-bottom: 20px;">
				// 	${optionsButtons}
				// 	<a href="${import.meta.env.VITE_REDIRECT_URI+"/refuseOffer/"+response.data.id}" style="display:inline-block;background-color:#F2F2F2;color:#008089;padding:10px 20px;text-decoration:none" target="_blank">${t('refuseOffers')}</a>
				// 	<div style="margin-top: 15px;"><a target="_blank" href="www.omnifreight.eu">www.omnifreight.eu</a></div>
				// 	<div style="padding-bottom: 10px;"><a target="_blank" href="http://www.facebook.com/omnifreight">http://www.facebook.com/omnifreight</a></div>
				// 	<div>Italiëlei 211</div>
				// 	<div>2000 Antwerpen</div>
				// 	<div>Belgium</div>
				// 	<div>E-mail: transport@omnifreight.eu</div>
				// 	<div>Tel +32.3.295.38.82</div>
				// 	<div>Fax +32.3.295.38.77</div>
				// 	<div>Whatsapp +32.494.40.24.25</div>
				// 	<img src="https://omnifreight.eu/wp-content/uploads/2023/06/logo.jpg" style="max-width: 200px;">
				// </div>
				// `;
				// setContent(response.data.comment);
				// setLoad(false);
			}
		}
		catch (err: any) {
			console.log(err);
		}
	}

	return (
		<div style={{ background: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
			<Box py={2.5}>
				<Typography variant="h5" sx={{ mt: { xs: 4, md: 1.5, lg: 1.5 } }} mx={5}><b>{t('manageOffer')} N° {offerNumber}</b></Typography>
				<Box>
					{
						files !== null && options !== null && offer !== null ? 
						<PriceOffer
							id={id} files={files} options={options}
							offer={offer} setOffer={setOffer} type="page"
						/> : <Skeleton sx={{ mx: 5, my: 2 }} />
					}
				</Box>
			</Box>
		</div>
	);
}

export default ManagePriceOffer;
