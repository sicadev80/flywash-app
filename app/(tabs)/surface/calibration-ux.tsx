
import React, { useState } from 'react';
import { Text, View, Pressable, StyleSheet } from 'react-native';

export default function CalibrationUX() {
  const [step, setStep] = useState<'idle'|'draw'|'input'>('idle');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📏 Définir une distance réelle</Text>

      {step === 'idle' && (
        <>
          <Text style={styles.text}>
            Trace une ligne sur un élément dont tu connais la taille :
          </Text>
          <Text style={styles.examples}>
            • largeur de porte (~0,9 m){'\n'}
            • largeur façade (~4 m){'\n'}
            • hauteur mur (~2,5 m)
          </Text>

          <Pressable style={styles.button} onPress={() => setStep('draw')}>
            <Text style={styles.buttonText}>Tracer la distance</Text>
          </Pressable>
        </>
      )}

      {step === 'draw' && (
        <>
          <Text style={styles.text}>
            Clique 2 points sur la photo pour définir la ligne.
          </Text>

          <Pressable style={styles.button} onPress={() => setStep('input')}>
            <Text style={styles.buttonText}>Ligne définie ✔️</Text>
          </Pressable>
        </>
      )}

      {step === 'input' && (
        <>
          <Text style={styles.text}>
            Quelle est la longueur réelle de cette ligne ?
          </Text>

          <View style={styles.inputFake}>
            <Text style={{color:'#999'}}>Ex: 2.5 m</Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:{padding:20},
  title:{fontSize:20,fontWeight:'800',marginBottom:10},
  text:{fontSize:14,marginBottom:10},
  examples:{fontSize:13,color:'#666',marginBottom:20},
  button:{backgroundColor:'#D4AF37',padding:12,borderRadius:10},
  buttonText:{fontWeight:'800'},
  inputFake:{borderWidth:1,borderColor:'#ccc',padding:12,borderRadius:10}
});
