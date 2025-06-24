import './../../App.css';
import { useEffect, useRef, useState } from 'react';
import { BootstrapDialogTitle, BootstrapInput, buttonCloseStyles, inputIconStyles, inputLabelStyles } from '../../../utils/misc/styles';
import { Autocomplete, Box, Button, DialogActions, DialogContent, InputLabel, NativeSelect, Skeleton, TextField } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useTranslation } from 'react-i18next';
import { enqueueSnackbar } from 'notistack';
import StarterKit from '@tiptap/starter-kit';
import { RichTextEditor, MenuControlsContainer, MenuSelectHeading, MenuDivider, MenuButtonBold, MenuButtonItalic, MenuButtonStrikethrough, MenuButtonOrderedList, MenuButtonBulletedList, MenuSelectTextAlign, MenuButtonEditLink, MenuButtonHorizontalRule, MenuButtonUndo, MenuButtonRedo, type RichTextEditorRef, } from 'mui-tiptap';
import AutocompleteSearch from '../../../components/shared/AutocompleteSearch';
import { Anchor } from '@mui/icons-material';
import { haulageTypeOptions } from '../../../utils/constants';
import { getContactGetContacts } from '../../../api/client/crm';
import { getApiHaulageHaulages } from '../../api/client/pricing';
import { getApiTemplate, getApiTemplateById } from '../../../api/client/template';
import PortAutocomplete from '../../../components/shared/PortAutocomplete';
import { useAccount, useMsal } from '@azure/msal-react';
import { postApiEmail } from '../../../api/client/quote';

const defaultTemplate = "658e7e0d27587b09811c13ca";

function RequestPriceHaulage(props: any) {
    const { t } = useTranslation();
    
    const [subject, setSubject] = useState<string>(props.loadingCity !== null ? props.loadingCity.city.toUpperCase()+","+props.loadingCity.country.toUpperCase()+" / "+t("rateRequestHaulage") : "");
    const [recipients, setRecipients] = useState<any>([]);
    const [emptyPickupDepot, setEmptyPickupDepot] = useState<string>("");
    const [haulageType, setHaulageType] = useState<string>("On trailer, direct loading");
    const [loadingCityObj, setLoadingCityObj] = useState<any>(props.loadingCity);
    // const [loadingCity, setLoadingCity] = useState<string>("");
    const [deliveryPort, setDeliveryPort] = useState<any>(props.loadingPort);
    
    const [hauliersData, setHauliersData] = useState<any>(null);
    // const [content, setContent] = useState<string>("");
    const [templateBase, setTemplateBase] = useState<string>("");
    
    const [templates, setTemplates] = useState<any>([]);
    const [loadTemplates, setLoadTemplates] = useState<boolean>(false);
    const [selectedTemplate, setSelectedTemplate] = useState<string>(defaultTemplate);
    
    // const [mailLanguage, setMailLanguage] = useState<string>("fr");
    const [load, setLoad] = useState<boolean>(false);
    const [loadTemplate, setLoadTemplate] = useState<boolean>(false);

    const rteRef = useRef<RichTextEditorRef>(null);
    
    const { accounts } = useMsal();
    const account = useAccount(accounts[0] || {});
    
    const postEmail = async(from: string, to: string, subject: string, htmlContent: string) => {
        const form = new FormData();
        form.append('From', from);
        form.append('To', to);
        form.append('Subject', subject);
        form.append('HtmlContent', htmlContent);
        
        postApiEmail({body: {
			From: from,
			To: to,
			Subject: subject,
			HtmlContent: htmlContent
		}})
        // .then((response: any) => response.json())
        .then((response: any) => {
            if (response !== undefined && response !== null && response.status == 200) {
                enqueueSnackbar(t('mailSentTo')+to, { variant: "success", anchorOrigin: { horizontal: "right", vertical: "top"} });
            }
            else {
                enqueueSnackbar(t('errorHappened'), { variant: "error", anchorOrigin: { horizontal: "right", vertical: "top"} });
            }
        });
    }

    const sendPriceRequestHaulage = async () => {
        if (recipients.length !== 0) {
            // var myEmails = ["penayecyrille@gmail.com", "cyrille.penaye@omnifreight.eu"];
            var selectedMails = recipients.map((elm: any) => elm.email);
            console.log(selectedMails);

            var footer = `
            <div style="font-family: Verdana; padding-top: 35px;">
                <div>${account?.name}</div>
                <div style="margin-top: 5px;"><a target="_blank" href="www.omnifreight.eu">www.omnifreight.eu</a></div>
                <div style="padding-bottom: 10px;"><a target="_blank" href="http://www.facebook.com/omnifreight">http://www.facebook.com/omnifreight</a></div>
                <div>Italiëlei 211</div>
                <div>2000 Antwerpen</div>
                <div>Belgium</div>
                <div>E-mail: ${account?.username}</div>
                <div>Tel +32.3.295.38.82</div>
                <div>Fax +32.3.295.38.77</div>
                <div>Whatsapp +32.494.40.24.25</div>
                <img src="https://omnifreight.eu/wp-content/uploads/2023/06/logo.jpg" style="max-width: 200px;">
            </div>
            `;
            for (var i=0; i < selectedMails.length; i++) {
                console.log("Mail sent to : "+selectedMails[i]);
                enqueueSnackbar(t('mailSentTo')+selectedMails[i], { variant: "success", anchorOrigin: { horizontal: "right", vertical: "top"} });
                postEmail("pricing@omnifreight.eu", selectedMails.join(','), subject, "<div style='font-family: Verdana;'>"+rteRef.current?.editor?.getHTML()+"</div>"+footer);    
            }
        }
        else {
            enqueueSnackbar(t('errorSelectRecipient'), { variant: "warning", anchorOrigin: { horizontal: "right", vertical: "top"} });
        }
    }

    const getClients = async () => {
        try {
            const response = await getContactGetContacts({query: { category: "SUPPLIERS", pageSize: 1000 }});
            if (response !== null && response !== undefined) {
                // Removing duplicates from client array
                setHauliersData(response.data?.data?.filter((obj: any, index: number, self: any) => index === self.findIndex((o: any) => o.contactName === obj.contactName)));
            }
        }
        catch (err: any) {
            console.log(err);
        }
    }
    
    function getAllHauliers(data: any) {
        if (!Array.isArray(data)) {
            // Handle invalid data
            return [];
        }
        const hauliersSet = new Set();      
        data.forEach((route) => {
            if (route.hauliers && Array.isArray(route.hauliers)) {
                route.hauliers.forEach((supplier: any) => {
                    if (supplier.haulierName) {
                        hauliersSet.add(supplier.haulierName);
                    }
                });
            }
        });
      
        // Convert the Set to an array
        const carriers = Array.from(hauliersSet);
        return carriers;
    }

    const searchHaulages = async () => {
        try {
            setLoad(true);
            const response = await getApiHaulageHaulages({query: { LoadingCity: loadingCityObj?.portId, LoadingPortId: deliveryPort?.portId }});
            if (response !== null && response !== undefined) {
                var aux = getAllHauliers(response.data);
                setRecipients(hauliersData.filter((obj: any) => aux.includes(obj.contactName) && obj.email !== "" && obj.email !== null));
                setLoad(false);
            }
            else {
                setLoad(false);
            }
        }
        catch (err: any) {
            console.log(err);
            setLoad(false);
        }
    }

    const getTemplates = async () => {
        try {
            const response: any = await getApiTemplate({query: { Tags: ["haulage"] }});
            if (response !== null && response.data !== undefined) {
                setTemplates(response.data?.data);
                console.log(response);
                setLoadTemplates(false);
            }
            else {
                setLoadTemplates(false);
            }
        }
        catch (err: any) {
            console.log(err);
        }
    }
    
    const getTemplate = async (id: string) => {
        setLoadTemplate(true)
        try {
            const response: any = await getApiTemplateById({path: {id: id}});
            if (response !== null && response !== undefined) {
                setTemplateBase(response.data?.data?.content || "");
                setLoadTemplate(false);
            }
            else {
                setLoadTemplate(false);
            }
        }
        catch (err: any) {
            console.log(err);
            setLoadTemplate(false);
        }
    }
    
    function generateEmailContent(template: string, variables: any) {
        return template.replace(/\{\{(.*?)\}\}/g, (_, variableName: any) => {
            const trimmedName = variableName.trim();
            // Si la variable est non nulle/vide, l'encapsuler dans <strong>
            if (variables[trimmedName]) {
                return `<strong>${variables[trimmedName]}</strong>`;
            } else {
                return `{{${trimmedName}}}`; // Laisser le placeholder si la variable est nulle/vide
            }
        });
    }
    
    function getDefaultContent(template: any) {
        var postalCode = loadingCityObj !== null ? loadingCityObj.postalCode !== undefined ? loadingCityObj.postalCode : "" : ""; 
        var loadingCity = loadingCityObj !== null ? loadingCityObj.city.toUpperCase()+', '+loadingCityObj.country.toUpperCase() : "";
        if (postalCode !== "") {
            loadingCity = loadingCityObj.city.toUpperCase()+', '+postalCode+', '+loadingCityObj.country.toUpperCase();
        }

        var destinationPort = deliveryPort !== null ? deliveryPort.portName+', '+deliveryPort.country.toUpperCase() : "";
        
        const variables = { loadingCity, destinationPort, emptyPickupDepot, haulageType };
        return generateEmailContent(template, variables);
    }

    useEffect(() => {
        var postalCode = loadingCityObj !== null ? loadingCityObj.postalCode !== undefined ? loadingCityObj.postalCode : "" : ""; 
        var loadingCity = loadingCityObj !== null ? loadingCityObj.city.toUpperCase()+', '+loadingCityObj.country.toUpperCase() : "";
        if (postalCode !== "") {
            loadingCity = loadingCityObj.city.toUpperCase()+', '+postalCode+', '+loadingCityObj.country.toUpperCase();
        }
        
        if (loadingCityObj !== null) {
            setSubject(loadingCity+" / "+t("rateRequestHaulage"));
        }
        else {
            setSubject("");
        }
    }, [loadingCityObj]);

    useEffect(() => {
        getTemplate(selectedTemplate);
    }, [selectedTemplate]);

    useEffect(() => {
        var postalCode = loadingCityObj !== null ? loadingCityObj.postalCode !== undefined ? loadingCityObj.postalCode : "" : ""; 
        var loadingCity = loadingCityObj !== null ? loadingCityObj.city.toUpperCase()+', '+loadingCityObj.country.toUpperCase() : "";
        if (postalCode !== "") {
            loadingCity = loadingCityObj.city.toUpperCase()+', '+postalCode+', '+loadingCityObj.country.toUpperCase();
        }

        var destinationPort = deliveryPort !== null ? deliveryPort.portName+', '+deliveryPort.country : "";
        
        const variables = { loadingCity, destinationPort, emptyPickupDepot, haulageType };
        rteRef.current?.editor?.commands.setContent(generateEmailContent(templateBase, variables));
    }, [loadingCityObj, deliveryPort, haulageType, emptyPickupDepot, templateBase, selectedTemplate]);

    useEffect(() => {
        getClients();
        getTemplates();
    }, []);

    useEffect(() => {
        if (hauliersData !== null) {
            searchHaulages();
        }
    }, [deliveryPort, hauliersData]);

    return (
        <>
            {
                true ? // hauliersData !== null
                <>
                    <BootstrapDialogTitle id="custom-dialog-title6" onClose={props.closeModal}>
                        <b>{t('priceRequestHaulage')}</b>
                    </BootstrapDialogTitle>
                    <DialogContent dividers>
                        <Grid container spacing={2} px={2}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Grid container spacing={1}>
                                    <Grid size={{ xs: 12 }} mt={0.5}>
                                        {
                                            hauliersData !== null && recipients !== null && load !== true ? 
                                            <>
                                                <InputLabel htmlFor="recipients" sx={inputLabelStyles}>{t('recipients')}</InputLabel>
                                                <Autocomplete
                                                    multiple    
                                                    disablePortal
                                                    id="recipients"
                                                    // placeholder="Carriers recipients"
                                                    options={hauliersData}
                                                    getOptionLabel={(option: any) => { 
                                                        if (option !== undefined && option !== null && option !== "") {
                                                            if (option.contactName !== undefined && option.contactName !== null) {
                                                                return `${option.contactName}`;
                                                            }
                                                            return "";
                                                        }
                                                        return ""; 
                                                    }}
                                                    value={recipients}
                                                    sx={{ mt: 1 }}
                                                    renderInput={(params: any) => <TextField placeholder="Carriers recipients" {...params} sx={{ textTransform: "lowercase" }} />}
                                                    onChange={(_: any, value: any) => { setRecipients(value); }}
                                                    fullWidth
                                                />
                                            </> : <Skeleton />
                                        }
                                    </Grid>
                                    <Grid size={{ xs: 12 }} mt={0.5}>
                                        <InputLabel htmlFor="subject" sx={inputLabelStyles}>{t('subject')}</InputLabel>
                                        <BootstrapInput id="subject" value={subject} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubject(e.target.value)} fullWidth />
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 12 }} mt={0.5}>
                                        <InputLabel htmlFor="emptyPickupDepot" sx={inputLabelStyles}>{t('emptyPickupDepot')}</InputLabel>
                                        <BootstrapInput id="emptyPickupDepot" type="text" value={emptyPickupDepot} onChange={(e: any) => setEmptyPickupDepot(e.target.value)} fullWidth />
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 12 }}>
                                        <InputLabel htmlFor="haulageType" sx={inputLabelStyles}>{t('haulageType')}</InputLabel>
                                        <NativeSelect
                                            id="haulageType"
                                            value={haulageType}
                                            onChange={(e: any) => { setHaulageType(e.target.value) }}
                                            input={<BootstrapInput />}
                                            fullWidth
                                        >
                                            {haulageTypeOptions.map((elm: any, i: number) => (
                                                <option key={"haulageElm-"+i} value={elm.value}>{t(elm.label)}</option>
                                            ))}
                                        </NativeSelect>
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 12 }} mt={0.5}>
                                        <InputLabel htmlFor="loading-city" sx={inputLabelStyles}>{t('loadingCity')}</InputLabel>
                                        <AutocompleteSearch id="loading-city" value={loadingCityObj} onChange={setLoadingCityObj} fullWidth  />
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 12 }} mt={0.5}>
                                        <InputLabel htmlFor="deliveryPort" sx={inputLabelStyles}><Anchor fontSize="small" sx={inputIconStyles} /> {t('destinationPort')}</InputLabel>
                                        {
                                            props.ports !== null ?
                                            <PortAutocomplete id="port-departure" options={props.ports} value={deliveryPort} onChange={setDeliveryPort} fullWidth /> : <Skeleton />
                                        }
                                    </Grid>
                                </Grid>
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }} mt={0.5}>
                                <Grid container>
                                    <Grid size={{ xs: 12 }}>
                                        <InputLabel htmlFor="selectedTemplate" sx={inputLabelStyles}>{t('selectedTemplate')}</InputLabel>
                                        {
                                            loadTemplates !== true ?
                                            <NativeSelect
                                                id="selectedTemplate"
                                                value={selectedTemplate}
                                                onChange={(e: any) => { setSelectedTemplate(e.target.value); }}
                                                input={<BootstrapInput />}
                                                fullWidth
                                            >
                                                {templates.map((elm: any, i: number) => (
                                                    <option key={"templateElm-"+i} value={elm.id}>{elm.name}</option>
                                                ))}
                                            </NativeSelect> : <Skeleton />
                                        }
                                    </Grid>

                                    {/* <Grid size={{ xs: 12 }}
                                        <InputLabel htmlFor="mailLanguage" sx={inputLabelStyles}>{t('mailLanguage')}</InputLabel>
                                        <ToggleButtonGroup
                                            color="primary"
                                            value={mailLanguage}
                                            exclusive
                                            // size="small"
                                            onChange={(event: React.MouseEvent<HTMLElement>, newValue: string,) => { 
                                                setMailLanguage(newValue); 
                                                if (newValue === "fr") {
                                                    rteRef.current?.editor?.commands.setContent(templateBase);
                                                }
                                                else {
                                                    rteRef.current?.editor?.commands.setContent(templateBaseEn);
                                                }
                                            }}
                                            aria-label="Platform"
                                            fullWidth
                                            sx={{ mt: 1, maxHeight: "44px" }}
                                        >
                                            <ToggleButton value="fr"><img src="/assets/img/flags/flag-fr.png" style={{ width: "12px", marginRight: "6px" }} alt="flag english" /> Français</ToggleButton>
                                            <ToggleButton value="en"><img src="/assets/img/flags/flag-en.png" style={{ width: "12px", marginRight: "6px" }} alt="flag english" /> English</ToggleButton>
                                        </ToggleButtonGroup>
                                    </Grid> */}
                                    <Grid size={{ xs: 12 }} mt={1.5}>
                                        <InputLabel htmlFor="details" sx={inputLabelStyles}>{t('detailsOffer')}</InputLabel>
                                        <Box sx={{ mt: 1 }}>
                                            {
                                                loadTemplate !== true ?
                                                <RichTextEditor
                                                    ref={rteRef}
                                                    extensions={[StarterKit]}
                                                    content={getDefaultContent(templateBase)}
                                                    renderControls={() => (
                                                    <MenuControlsContainer>
                                                        <MenuSelectHeading />
                                                        <MenuDivider />
                                                        <MenuButtonBold />
                                                        <MenuButtonItalic />
                                                        <MenuButtonStrikethrough />
                                                        <MenuButtonOrderedList />
                                                        <MenuButtonBulletedList />
                                                        <MenuSelectTextAlign />
                                                        <MenuButtonEditLink />
                                                        <MenuButtonHorizontalRule />
                                                        <MenuButtonUndo />
                                                        <MenuButtonRedo />
                                                    </MenuControlsContainer>
                                                    )}
                                                />
                                                : <Skeleton />
                                            }
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button variant="contained" color="primary" className="mr-3" onClick={sendPriceRequestHaulage} sx={{ textTransform: "none" }}>{t('send')}</Button>
                        <Button variant="contained" onClick={props.closeModal} sx={buttonCloseStyles}>{t('close')}</Button>
                    </DialogActions>
                </>
                : <Skeleton />
            }
        </>
    );
}

export default RequestPriceHaulage;
