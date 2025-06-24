import { useState } from 'react';
import { BootstrapDialogTitle, BootstrapInput, buttonCloseStyles, inputLabelStyles } from '../../../utils/misc/styles';
import { Button, DialogActions, DialogContent, InputLabel, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useTranslation } from 'react-i18next';
import { enqueueSnackbar } from 'notistack';
import { useAccount, useMsal } from '@azure/msal-react';
import { getApiRequestQuoteNotes } from '../../../api/client/quote';

const RequestAddNote = (props: any) => {
    const [generalNote, setGeneralNote] = useState<string>("");

    const { accounts } = useMsal();
    const account = useAccount(accounts[0] || {});

    const { t } = useTranslation();
    
    const addRequestNote = async () => {
        if (generalNote !== "") {
            try {
                var dataSent = { "content": generalNote, "requestQuoteId": props.id, "noteType": "General", "idUser": account?.username };
                const response = await getApiRequestQuoteNotes({body: dataSent});
                if (response !== null) {
                    props.closeModal();
                    enqueueSnackbar(t('commentSuccessAdded'), { variant: "success", anchorOrigin: { horizontal: "right", vertical: "top"} });
                }
                else {
                    enqueueSnackbar(t('errorHappened'), { variant: "error", anchorOrigin: { horizontal: "right", vertical: "top"} });
                }
            }
            catch (err: any) {
                console.log(err);
            }
        }
        else {
            enqueueSnackbar(t('contentEmpty'), { variant: "error", anchorOrigin: { horizontal: "right", vertical: "top"} });
        }
    }

    return (
        <>
            <BootstrapDialogTitle id="custom-dialog-title3" onClose={props.closeModal}>
                <b>{t('addCommentNote')}</b>
            </BootstrapDialogTitle>
            <DialogContent dividers>
                <Typography variant="subtitle1" gutterBottom px={2}>
                    {t('pleaseFillAddNote')}
                </Typography>
                <Grid container spacing={2} mt={1} px={2}>
                    <Grid size={{ xs: 12 }} mt={1}>
                        <InputLabel htmlFor="general-note" sx={inputLabelStyles}>{t('generalNote')}</InputLabel>
                        <BootstrapInput id="general-note" type="text" multiline rows={4} value={generalNote} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGeneralNote(e.target.value)} fullWidth />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button variant="contained" color="primary" className="mr-3" onClick={addRequestNote} sx={{ textTransform: "none" }}>{t('validate')}</Button>
                <Button variant="contained" onClick={props.closeModal} sx={buttonCloseStyles}>{t('close')}</Button>
            </DialogActions>
        </>
    );
}

export default RequestAddNote;
