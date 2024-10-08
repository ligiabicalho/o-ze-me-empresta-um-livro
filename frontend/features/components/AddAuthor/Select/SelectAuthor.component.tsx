import {
  TextField,
  Autocomplete,
  createFilterOptions
} from '@mui/material';
import { useEffect, useState } from 'react';
import AddAuthorDialog from '../Dialog/AddAuthor.component';
import { createAuthor } from '@/requests/authors/createAuthor';
import { getAuthors } from '@/requests/authors/getAuthors';
import SnackAlert from '@/common/components/SnackAlert/SnackAlert.component';
import { AuthorOptionType, SelectAuthorProps } from './SelectAuthor.interface';
import { AuthorName } from '../Dialog/AddAuthor.interface';

const filter = createFilterOptions<AuthorOptionType>();

const SelectAuthor = ({ author, setAuthor }: SelectAuthorProps) => {
  const [openAddAuthor, toggleOpenAddAuthor] = useState<boolean>(false);
  const [addAuthorData, setAddAuthorData] = useState<AuthorName>({ firstName: '', lastName: '' });
  const [authorsList, setAuthorsList] = useState<AuthorOptionType[]>([]);
  const [snackSuccess, setSnackSuccess] = useState({ open: false, message: '' });
  const [snackError, setSnackError] = useState({ open: false, message: '' });

  useEffect(() => {
    const fetchAuthorsList = async () => {
      const authorsList = await getAuthors();
      if(!authorsList) {
        setSnackError({ 
          open: true,
          message: "Erro ao buscar autores."
        });
      }
      if(authorsList){
        const sortedAuthors = authorsList.sort((a, b) => {
            return a.name.localeCompare(b.name);
          });
        setAuthorsList(sortedAuthors);
      }
    }

    fetchAuthorsList();
  }, [])

  const handleCloseDialog = () => {
    setAddAuthorData({
      firstName: '',
      lastName: '',
    });
    toggleOpenAddAuthor(false);
  };

  const handleSubmitAddAuthor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newAuthor = await createAuthor(addAuthorData);
    if(newAuthor){ 
      setAuthor(newAuthor);
      setAuthorsList((prev) => [...prev, newAuthor] as AuthorOptionType[]);
      setSnackSuccess({ 
        open: true,
        message: "Autor adicionado com sucesso!"
      });
      handleCloseDialog();
    }
  };

  return (
    <>
      <AddAuthorDialog 
        open={openAddAuthor} 
        handleClose={handleCloseDialog}
        handleSubmit={handleSubmitAddAuthor}
        dialogValue={addAuthorData}
        setDialogValue={setAddAuthorData}
      />

      <SnackAlert severity='success' state={snackSuccess} setState={setSnackSuccess} />
      <SnackAlert severity='error' state={snackError} setState={setSnackError} />

      <Autocomplete
        value={author}
        onChange={(event, newValue) => {
          if (typeof newValue === 'string') {
            setTimeout(() => {
              toggleOpenAddAuthor(true);
              const [firstName, ...lastName] = newValue.split(' ');
              setAddAuthorData({
                firstName: firstName,
                lastName: lastName.join(' '),
              });
            });
            } else if (newValue && newValue.inputValue) {
              toggleOpenAddAuthor(true);
              const [firstName, ...lastName] = newValue.inputValue.split(' ');
              setAddAuthorData({
                firstName: firstName,
                lastName: lastName.join(' '),
              });
            } else {
              setAuthor(newValue || { name: '' });
            }
          }}
        filterOptions={(options, params) => {
          const filtered = filter(options, params);

          if (params.inputValue !== '') {
            filtered.push({
              inputValue: params.inputValue,
              name: `Adicionar "${params.inputValue}"`,
            });
          }
          return filtered;
        }}
        id="select-or-create-author"
        options={authorsList}
        getOptionLabel={(option) => {
          if (typeof option === 'string') {
            return option;
          }
          if (option.inputValue) {
            return option.inputValue;
          }
          return option.name;
        }}
        renderInput={(params) => (
          <TextField {...params} label="Autor" fullWidth />
        )}
        freeSolo
        autoHighlight
        selectOnFocus
        clearOnBlur
        handleHomeEndKeys
        renderOption={(props, option) => {
          const { key, ...optionProps } = props;
          return (
            <li key={key} {...optionProps}>
              {option.name}
            </li>
          );
        }}
      />
    </>
  );
}

export default SelectAuthor;